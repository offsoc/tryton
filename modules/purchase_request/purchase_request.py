# This file is part of Tryton.  The COPYRIGHT file at the top level of
# this repository contains the full copyright notices and license terms.
import datetime
from functools import partial
from itertools import groupby

from trytond.i18n import gettext
from trytond.model import Index, ModelSQL, ModelView, fields
from trytond.model.exceptions import AccessError
from trytond.modules.company.model import (
    employee_field, reset_employee, set_employee)
from trytond.pool import Pool
from trytond.pyson import Bool, Eval, If
from trytond.tools import firstline, sortable_values
from trytond.transaction import Transaction
from trytond.wizard import (
    Button, StateAction, StateTransition, StateView, Wizard)

STATES = {
    'readonly': Eval('state') != 'draft',
    }


class PurchaseRequest(ModelSQL, ModelView):
    __name__ = 'purchase.request'

    product = fields.Many2One(
        'product.product', "Product", readonly=True, ondelete='CASCADE',
        domain=[
            If((Eval('state') == 'draft')
                & ~(Eval('quantity', 0) < 0),
                ('purchasable', '=', True),
                ()),
            ],
        context={
            'company': Eval('company', -1),
            },
        depends={'company'})
    description = fields.Text('Description', readonly=True)
    summary = fields.Function(
        fields.Char('Summary'), 'on_change_with_summary',
        searcher='search_summary')
    party = fields.Many2One(
        'party.party', "Party", states=STATES,
        context={
            'company': Eval('company', -1),
            },
        depends={'company'})
    quantity = fields.Float(
        "Quantity", required=True, states=STATES, digits='unit')
    unit = fields.Many2One(
        'product.uom', "Unit", ondelete='RESTRICT',
        domain=[
            If(Bool(Eval('product_uom_category')),
                ('category', '=', Eval('product_uom_category')),
                ('category', '!=', -1)),
            ],
        states={
            'required': Bool(Eval('product')),
            'readonly': STATES['readonly'],
            })
    product_uom_category = fields.Function(
        fields.Many2One(
            'product.uom.category', "Product UoM Category",
            help="The category of Unit of Measure for the product."),
        'on_change_with_product_uom_category')
    computed_quantity = fields.Float('Computed Quantity', readonly=True)
    computed_unit = fields.Many2One(
        'product.uom', "Computed Unit", readonly=True)
    purchase_date = fields.Date('Best Purchase Date', readonly=True)
    supply_date = fields.Date('Expected Supply Date', readonly=True)
    default_uom = fields.Function(
        fields.Many2One(
            'product.uom', "Default UoM",
            help="The default Unit of Measure."),
        'on_change_with_default_uom')
    stock_level = fields.Float(
        "Stock at Supply Date", readonly=True, digits='default_uom')
    warehouse = fields.Many2One(
        'stock.location', "Warehouse",
        states={
            'required': Eval('warehouse_required', False),
            },
        domain=[('type', '=', 'warehouse')],
        readonly=True)
    warehouse_required = fields.Function(fields.Boolean('Warehouse Required'),
        'get_warehouse_required')
    purchase_line = fields.Many2One('purchase.line', 'Purchase Line',
        readonly=True)
    purchase = fields.Function(fields.Many2One('purchase.purchase',
        'Purchase'), 'get_purchase', searcher='search_purchase')
    company = fields.Many2One('company.company', 'Company', required=True,
            readonly=True)
    origin = fields.Reference('Origin', selection='get_origin', readonly=True)
    exception_ignored = fields.Boolean('Ignored Exception')

    purchased_by = employee_field(
        "Purchased By", states=['purchased', 'done', 'cancelled', 'exception'])
    state = fields.Selection([
            ('draft', "Draft"),
            ('purchased', "Purchased"),
            ('done', "Done"),
            ('cancelled', "Cancelled"),
            ('exception', "Exception"),
            ], "State", required=True, readonly=True, sort=False)

    @classmethod
    def __setup__(cls):
        super().__setup__()
        t = cls.__table__()
        cls._sql_indexes.add(
            Index(
                t,
                (t.state, Index.Equality(cardinality='low')),
                where=t.state.in_(['draft', 'purchased', 'exception'])))
        cls._order[0] = ('id', 'DESC')
        cls._buttons.update({
                'handle_purchase_cancellation_exception': {
                    'invisible': Eval('state') != 'exception',
                    'depends': ['state'],
                    },
                })

    @classmethod
    def __register__(cls, module_name):
        table_h = cls.__table_handler__(module_name)

        # Migration from 6.8: rename uom to unit
        if (table_h.column_exist('uom')
                and not table_h.column_exist('unit')):
            table_h.column_rename('uom', 'unit')

        # Migration from 6.8: rename uom to unit
        if (table_h.column_exist('computed_uom')
                and not table_h.column_exist('computed_unit')):
            table_h.column_rename('computed_uom', 'computed_unit')

        super().__register__(module_name)

    def get_rec_name(self, name):
        pool = Pool()
        Lang = pool.get('ir.lang')
        if self.product:
            lang = Lang.get()
            rec_name = (lang.format_number_symbol(
                    self.quantity, self.unit, digits=self.unit.digits)
                + ' %s' % self.product.name)
        elif self.description:
            rec_name = self.description.splitlines()[0]
        else:
            rec_name = str(self.id)

        if self.warehouse:
            return "%s @% s" % (rec_name, self.warehouse.name)
        else:
            return rec_name

    @classmethod
    def search_rec_name(cls, name, clause):
        _, operator, value = clause
        if operator.startswith('!') or operator.startswith('not'):
            bool_op = 'AND'
        else:
            bool_op = 'OR'
        domain = [bool_op]
        if value is not None:
            names = value.split('@', 1)
            sub_domain = [('product.template.name', operator, names[0])]
            if len(names) != 1 and names[1]:
                sub_domain.append(('warehouse', operator, names[1]))
                if bool_op == 'AND':
                    sub_domain.insert(0, 'OR')
            domain.append(sub_domain)
        domain.append(('description', *clause[1:]))
        return domain

    @staticmethod
    def default_company():
        return Transaction().context.get('company')

    @staticmethod
    def default_exception_ignored():
        return False

    def get_purchase(self, name):
        if self.purchase_line:
            return self.purchase_line.purchase.id

    @classmethod
    def search_purchase(cls, name, clause):
        return [('purchase_line.' + clause[0],) + tuple(clause[1:])]

    @property
    def currency(self):
        return

    @classmethod
    def default_state(cls):
        return 'draft'

    def get_state(self):
        if self.purchase_line:
            if (self.purchase_line.purchase.state == 'cancelled'
                    and not self.exception_ignored):
                return 'exception'
            elif self.purchase_line.purchase.state == 'cancelled':
                return 'cancelled'
            elif self.purchase_line.purchase.state == 'done':
                return 'done'
            else:
                return 'purchased'
        return 'draft'

    @classmethod
    def update_state(cls, requests):
        for request in requests:
            state = request.get_state()
            if state != request.state:
                request.state = state
        cls.save(requests)

    @classmethod
    @set_employee('purchased_by')
    def set_purchased(cls, requests):
        cls.update_state(requests)

    @classmethod
    @reset_employee('purchased_by')
    def reset_purchased(cls, requests):
        cls.update_state(requests)

    def get_warehouse_required(self, name):
        return self.product and self.product.type in ('goods', 'assets')

    @fields.depends('product')
    def on_change_with_product_uom_category(self, name=None):
        return self.product.default_uom_category if self.product else None

    @fields.depends('product')
    def on_change_with_default_uom(self, name=None):
        return self.product.default_uom if self.product else None

    @fields.depends('description')
    def on_change_with_summary(self, name=None):
        return firstline(self.description or '')

    @classmethod
    def search_summary(cls, name, clause):
        return [('description', *clause[1:])]

    @classmethod
    def _get_origin(cls):
        'Return the set of Model names for origin Reference'
        return set()

    @classmethod
    def get_origin(cls):
        pool = Pool()
        IrModel = pool.get('ir.model')
        get_name = IrModel.get_name
        models = cls._get_origin()
        return [(None, '')] + [(m, get_name(m)) for m in models]

    @classmethod
    def view_attributes(cls):
        return super().view_attributes() + [
            ('/tree', 'visual', If(Eval('state') == 'cancelled', 'muted', '')),
            ]

    @classmethod
    def check_modification(cls, mode, requests, values=None, external=False):
        super().check_modification(
            mode, requests, values=values, external=external)
        if mode == 'create':
            if external:
                raise AccessError(
                    gettext('purchase_request.msg_request_no_create'))
        elif mode == 'delete':
            for request in requests:
                if request.purchase_line:
                    raise AccessError(gettext(
                            'purchase_request.msg_request_delete_purchased',
                            request=request.rec_name))

    @classmethod
    def copy(cls, requests, default=None):
        if default is None:
            default = {}
        else:
            default = default.copy()
        default.setdefault('purchased_by')
        return super().copy(requests, default=default)

    @classmethod
    def find_best_product_supplier(cls, product, date, **pattern):
        "Return the best product supplier to request product at date"
        pool = Pool()
        Date = pool.get('ir.date')
        with Transaction().set_context(context=product._context):
            today = Date.today()
        for product_supplier in product.product_suppliers_used(**pattern):
            if date is None:
                return product_supplier
            supply_date = product_supplier.compute_supply_date(date=today)
            timedelta = date - supply_date
            if timedelta >= datetime.timedelta(0):
                return product_supplier

    @classmethod
    def find_best_supplier(cls, product, date, **pattern):
        '''
        Return the best supplier and purchase_date for the product.
        '''
        pool = Pool()
        Date = pool.get('ir.date')

        product_supplier = cls.find_best_product_supplier(
            product, date, **pattern)
        if product_supplier:
            supplier = product_supplier.party
            purchase_date = product_supplier.compute_purchase_date(date)
        else:
            supplier = None
            with Transaction().set_context(context=product._context):
                purchase_date = Date.today()
        return supplier, purchase_date

    @classmethod
    @ModelView.button_action(
        'purchase_request.wizard_purchase_cancellation_handle_exception')
    def handle_purchase_cancellation_exception(cls, purchases):
        pass


class CreatePurchaseAskParty(ModelView):
    __name__ = 'purchase.request.create_purchase.ask_party'
    product = fields.Many2One('product.product', 'Product', readonly=True)
    description = fields.Text('Description', readonly=True)
    company = fields.Many2One('company.company', 'Company', readonly=True)
    party = fields.Many2One('party.party', 'Supplier', required=True)


class CreatePurchase(Wizard):
    __name__ = 'purchase.request.create_purchase'
    start = StateTransition()
    ask_party = StateView('purchase.request.create_purchase.ask_party',
        'purchase_request.purchase_request_create_purchase_ask_party', [
            Button('Cancel', 'end', 'tryton-cancel'),
            Button('Continue', 'start', 'tryton-forward', default=True),
            ])
    open_ = StateAction('purchase.act_purchase_form')

    def default_ask_party(self, fields):
        for request in self.records:
            if request.purchase_line:
                continue
            if not request.party:
                break
        return {
            'product': request.product.id if request.product else None,
            'description': request.description,
            'company': request.company.id,
            }

    @classmethod
    def _group_purchase_key(cls, requests, request):
        '''
        The key to group lines by purchases
        A list of key-value as tuples of the purchase
        '''
        return (
            ('company', request.company),
            ('party', request.party),
            ('warehouse', request.warehouse),
            ('currency', request.currency),
            )

    def _group_purchase_line_key(self, request):
        '''
        The key to group requests by lines
        A list of key-value as tuples of the purchase line
        '''
        return (
            ('product', request.product),
            ('description', request.description or ''),
            ('unit', request.unit),
            )

    def transition_start(self):
        pool = Pool()
        Request = pool.get('purchase.request')
        Purchase = pool.get('purchase.purchase')
        Line = pool.get('purchase.line')
        Date = pool.get('ir.date')

        requests = self.records

        if self.ask_party.party and self.ask_party.company:
            def compare_string(first, second):
                return (first or '') == (second or '')

            def to_write(request):
                return (not request.purchase_line
                    and not request.party
                    and request.product == self.ask_party.product
                    and compare_string(
                        request.description, self.ask_party.description))
            reqs = list(filter(to_write, requests))
            if reqs:
                Request.write(reqs, {
                        'party': self.ask_party.party.id,
                        })
            self.ask_party.product = None
            self.ask_party.description = None
            self.ask_party.party = None
            self.ask_party.company = None

        def to_ask_party(request):
            return not request.purchase_line and not request.party
        reqs = filter(to_ask_party, requests)
        if any(reqs):
            return 'ask_party'

        requests = [r for r in requests if not r.purchase_line]

        def _sort_keyfunc(requests, request):
            return (
                self._group_purchase_key(requests, request)
                + self._group_purchase_line_key(request))
        sort_keyfunc = partial(_sort_keyfunc, requests)

        keyfunc = partial(self._group_purchase_key, requests)
        requests = sorted(requests, key=sortable_values(sort_keyfunc))

        purchases = []
        lines = []
        for key, grouped_requests in groupby(requests, key=keyfunc):
            grouped_requests = list(grouped_requests)
            key = dict(key)
            with Transaction().set_context(company=int(key['company'])):
                today = Date.today()
            try:
                purchase_date = min(r.purchase_date
                    for r in grouped_requests
                    if r.purchase_date)
            except ValueError:
                purchase_date = today
            if purchase_date < today:
                purchase_date = today
            purchase = Purchase(purchase_date=purchase_date)
            for f, v in key.items():
                setattr(purchase, f, v)
            purchase.on_change_party()
            purchases.append(purchase)
            for line_key, line_requests in groupby(
                    grouped_requests, key=self._group_purchase_line_key):
                line_requests = list(line_requests)
                line = self.compute_purchase_line(
                    line_key, line_requests, purchase)
                line.purchase = purchase
                line.requests = line_requests
                lines.append(line)
        Purchase.save(purchases)
        Line.save(lines)
        Request.set_purchased(requests)
        return 'open_'

    @classmethod
    def compute_purchase_line(cls, key, requests, purchase):
        pool = Pool()
        Line = pool.get('purchase.line')

        line = Line()
        for f, v in key:
            setattr(line, f, v)
        line.purchase = purchase
        line.on_change_product()
        line.quantity = cls.compute_quantity(requests, line, purchase)
        if line.unit:
            line.quantity = line.unit.ceil(line.quantity)
        # Set again in case on_change's changed them
        for f, v in key:
            setattr(line, f, v)
        line.on_change_quantity()
        return line

    @classmethod
    def compute_quantity(cls, requests, line, purchase):
        pool = Pool()
        Uom = pool.get('product.uom')
        unit = line.unit
        compute_qty = Uom.compute_qty
        return sum(
            compute_qty(r.unit, r.quantity, unit, round=False)
            for r in requests)

    def do_open_(self, action):
        purchase_ids = list({
                r.purchase.id for r in self.records if r.purchase})
        action['domains'] = []
        return action, {
            'res_id': purchase_ids,
            }

    def end(self):
        return 'reload'


class HandlePurchaseCancellationException(Wizard):
    __name__ = 'purchase.request.handle.purchase.cancellation'

    start = StateView('purchase.request.handle.purchase.cancellation.start',
        'purchase_request.handle_purchase_cancellation_start', [
            Button('Cancel', 'end', 'tryton-cancel'),
            Button('Reset to Draft', 'reset', 'tryton-clear'),
            Button('Cancel Request', 'cancel_request', 'tryton-delete',
                default=True),
            ])
    reset = StateTransition()
    cancel_request = StateTransition()

    def transition_reset(self):
        for request in self.records:
            request.purchase_line = None
        self.model.reset_purchased(self.records)
        return 'end'

    def transition_cancel_request(self):
        for request in self.records:
            request.exception_ignored = True
        self.model.update_state(self.records)
        return 'end'


class HandlePurchaseCancellationExceptionStart(ModelView):
    __name__ = 'purchase.request.handle.purchase.cancellation.start'
