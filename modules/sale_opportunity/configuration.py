# This file is part of Tryton.  The COPYRIGHT file at the top level of
# this repository contains the full copyright notices and license terms.
from trytond.model import fields
from trytond.pool import Pool, PoolMeta
from trytond.pyson import Eval, Id


class Configuration(metaclass=PoolMeta):
    __name__ = 'sale.configuration'
    sale_opportunity_sequence = fields.MultiValue(fields.Many2One(
            'ir.sequence', "Opportunity Sequence", required=True,
            domain=[
                ('company', 'in', [Eval('context', {}).get('company', -1),
                        None]),
                ('sequence_type', '=',
                    Id('sale_opportunity', 'sequence_type_sale_opportunity')),
                ]))

    @classmethod
    def multivalue_model(cls, field):
        pool = Pool()
        if field == 'sale_opportunity_sequence':
            return pool.get('sale.configuration.sequence')
        return super().multivalue_model(field)

    @classmethod
    def default_sale_opportunity_sequence(cls, **pattern):
        return cls.multivalue_model(
            'sale_opportunity_sequence').default_sale_opportunity_sequence()


class ConfigurationSequence(metaclass=PoolMeta):
    __name__ = 'sale.configuration.sequence'
    sale_opportunity_sequence = fields.Many2One(
        'ir.sequence', "Opportunity Sequence", required=True,
        domain=[
            ('company', 'in', [Eval('company', -1), None]),
            ('sequence_type', '=',
                Id('sale_opportunity', 'sequence_type_sale_opportunity')),
            ])

    @classmethod
    def default_sale_opportunity_sequence(cls):
        pool = Pool()
        ModelData = pool.get('ir.model.data')
        try:
            return ModelData.get_id(
                'sale_opportunity', 'sequence_sale_opportunity')
        except KeyError:
            return None
