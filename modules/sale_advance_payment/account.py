# This file is part of Tryton.  The COPYRIGHT file at the top level of
# this repository contains the full copyright notices and license terms.

from trytond.model import fields
from trytond.pool import Pool, PoolMeta
from trytond.pyson import Bool, Eval, If


def AccountTypeMixin(template=False):

    class Mixin:
        __slots__ = ()
        unearned_revenue = fields.Boolean(
            "Unearned Revenue",
            domain=[
                If(Eval('statement') != 'balance',
                    ('unearned_revenue', '=', False), ()),
                ],
            states={
                'invisible': ((Eval('statement') != 'balance')
                    | Eval('assets', True)),
                })
    if not template:
        for fname in dir(Mixin):
            field = getattr(Mixin, fname)
            if not isinstance(field, fields.Field):
                continue
            field.states['readonly'] = (
                Bool(Eval('template', -1)) & ~Eval('template_override', False))
    return Mixin


class AccountTypeTemplate(AccountTypeMixin(template=True), metaclass=PoolMeta):
    __name__ = 'account.account.type.template'

    def _get_type_value(self, type=None):
        values = super()._get_type_value(type=type)
        if not type or type.unearned_revenue != self.unearned_revenue:
            values['unearned_revenue'] = self.unearned_revenue
        return values


class AccountType(AccountTypeMixin(), metaclass=PoolMeta):
    __name__ = 'account.account.type'


class Invoice(metaclass=PoolMeta):
    __name__ = 'account.invoice'

    def get_sales(self, name):
        pool = Pool()
        AdvancePaymentCondition = pool.get('sale.advance_payment.condition')

        sales = set(super().get_sales(name))
        for line in self.lines:
            if isinstance(line.origin, AdvancePaymentCondition):
                sales.add(line.origin.sale.id)
        return list(sales)

    @classmethod
    def search_sales(cls, name, clause):
        domain = super().search_sales(name, clause)
        return ['OR',
            domain,
            ('lines.origin.sale' + clause[0][len(name):],
                *clause[1:3], 'sale.advance_payment.condition', *clause[3:]),
            ]


class InvoiceLine(metaclass=PoolMeta):
    __name__ = 'account.invoice.line'

    advance_payment_recalled_lines = fields.One2Many(
        'account.invoice.line', 'origin', "Advance Payment Recalled Lines",
        readonly=True)

    @classmethod
    def _account_domain(cls, type_):
        domain = super()._account_domain(type_)
        if type_ == 'out':
            domain.append(('type.unearned_revenue', '=', True))
        return domain

    @property
    def origin_name(self):
        pool = Pool()
        Condition = pool.get('sale.advance_payment.condition')
        name = super().origin_name
        if isinstance(self.origin, Condition) and self.origin.id >= 0:
            name = self.origin.sale.rec_name
        return name

    @classmethod
    def _get_origin(cls):
        return (super()._get_origin()
            + ['sale.advance_payment.condition'])

    @classmethod
    def copy(cls, lines, default=None):
        default = default.copy() if default is not None else {}
        default.setdefault('advance_payment_recalled_lines')
        return super().copy(lines, default=default)
