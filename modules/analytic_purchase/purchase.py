# This file is part of Tryton.  The COPYRIGHT file at the top level of
# this repository contains the full copyright notices and license terms.
from trytond.model import fields
from trytond.modules.analytic_account import AnalyticMixin
from trytond.pool import Pool, PoolMeta
from trytond.pyson import Eval


class PurchaseLine(AnalyticMixin, metaclass=PoolMeta):
    __name__ = 'purchase.line'

    @classmethod
    def __setup__(cls):
        super().__setup__()
        cls.analytic_accounts.domain = [
            ('company', '=', Eval('company', -1)),
            ]
        cls.analytic_accounts.states = {
            'invisible': Eval('type') != 'line',
            'readonly': Eval('purchase_state') != 'draft',
            }

    def get_invoice_line(self):
        pool = Pool()
        AnalyticAccountEntry = pool.get('analytic.account.entry')

        invoice_lines = super().get_invoice_line()
        for invoice_line in invoice_lines:
            new_entries = AnalyticAccountEntry.copy(self.analytic_accounts,
                default={
                    'origin': None,
                    })
            invoice_line.analytic_accounts = new_entries
        return invoice_lines


class AnalyticAccountEntry(metaclass=PoolMeta):
    __name__ = 'analytic.account.entry'

    @classmethod
    def _get_origin(cls):
        origins = super()._get_origin()
        return origins + ['purchase.line']

    @fields.depends('origin')
    def on_change_with_company(self, name=None):
        pool = Pool()
        PurchaseLine = pool.get('purchase.line')
        company = super().on_change_with_company(name)
        if isinstance(self.origin, PurchaseLine) and self.origin.purchase:
            company = self.origin.purchase.company
        return company

    @classmethod
    def search_company(cls, name, clause):
        domain = super().search_company(name, clause)
        if domain:
            domain = ['OR', domain]
        domain.append(
            ('origin.purchase.' + clause[0],
                *clause[1:3], 'purchase.line', *clause[3:]))
        return domain

    @fields.depends('origin')
    def on_change_with_editable(self, name=None):
        pool = Pool()
        PurchaseLine = pool.get('purchase.line')
        editable = super().on_change_with_editable(name=name)
        if isinstance(self.origin, PurchaseLine):
            if self.origin.purchase_state != 'draft':
                editable = False
        return editable
