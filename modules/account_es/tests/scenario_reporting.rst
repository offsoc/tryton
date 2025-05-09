=============================
Account ES Reporting Scenario
=============================

Imports::

    >>> import datetime as dt
    >>> from decimal import Decimal
    >>> from functools import partial

    >>> from proteus import Model, Report, Wizard
    >>> from trytond.modules.account.tests.tools import (
    ...     create_chart, create_fiscalyear, get_accounts)
    >>> from trytond.modules.account_invoice.tests.tools import (
    ...     set_fiscalyear_invoice_sequences)
    >>> from trytond.modules.company.tests.tools import create_company, get_company
    >>> from trytond.tests.tools import activate_modules, assertEqual
    >>> from trytond.tools import file_open

Activate modules::

    >>> config = activate_modules(
    ...     'account_es',
    ...     create_company, partial(create_chart, chart='account_es.pgc_0_pyme'))

    >>> Country = Model.get('country.country')

Setup company::

    >>> spain = Country(code="ES", name="Spain")
    >>> spain.save()
    >>> company = get_company()
    >>> address, = company.party.addresses
    >>> address.country = spain
    >>> address.save()
    >>> tax_identifier = company.party.identifiers.new()
    >>> tax_identifier.type = 'eu_vat'
    >>> tax_identifier.code = 'ESB01000009'
    >>> phone = company.party.contact_mechanisms.new()
    >>> phone.value = '666 66 66 66'
    >>> company.party.save()

Create fiscal year::

    >>> fiscalyear = set_fiscalyear_invoice_sequences(
    ...     create_fiscalyear(
    ...         today=(dt.date(2018, 1, 1), dt.date(2018, 12, 31))))
    >>> fiscalyear.click('create_period')
    >>> period = fiscalyear.periods[0]

Get accounts::

    >>> accounts = get_accounts()
    >>> expense = accounts['expense']
    >>> revenue = accounts['revenue']

Create parties::

    >>> Country = Model.get('country.country')
    >>> spain = Country(name='Spain', code='ES')
    >>> spain.save()
    >>> Party = Model.get('party.party')
    >>> TaxRule = Model.get('account.tax.rule')
    >>> party = Party(name='Party')
    >>> tax_identifier = party.identifiers.new()
    >>> tax_identifier.type = 'es_vat'
    >>> tax_identifier.code = '00000000T'
    >>> address, = party.addresses
    >>> address.country = spain
    >>> address.postal_code = '25001'
    >>> party.es_province_code
    '25'
    >>> party.save()
    >>> tax_rule, = TaxRule.find([
    ...     ('company', '=', company.id),
    ...     ('kind', '=', 'purchase'),
    ...     ('name', '=', 'Retención IRPF 15%'),
    ...     ])
    >>> supplier = Party(name='Supplier')
    >>> supplier.supplier_tax_rule = tax_rule
    >>> tax_identifier = supplier.identifiers.new()
    >>> tax_identifier.type = 'eu_vat'
    >>> tax_identifier.code = 'ES00000001R'
    >>> supplier.es_province_code = '08'
    >>> supplier.save()
    >>> tax_rule, = TaxRule.find([
    ...     ('company', '=', company.id),
    ...     ('kind', '=', 'purchase'),
    ...     ('name', '=', 'Compras Intracomunitarias'),
    ...     ])
    >>> ec_supplier = Party(name='Intracomunitary Supplier')
    >>> ec_supplier.supplier_tax_rule = tax_rule
    >>> tax_identifier = ec_supplier.identifiers.new()
    >>> tax_identifier.type = 'eu_vat'
    >>> tax_identifier.code = 'BE0897290877'
    >>> ec_supplier.save()

Create account category::

    >>> Tax = Model.get('account.tax')
    >>> customer_tax, = Tax.find([
    ...     ('company', '=', company.id),
    ...     ('group.kind', '=', 'sale'),
    ...     ('name', '=', 'IVA 21% (bienes)'),
    ...     ])
    >>> supplier_tax, = Tax.find([
    ...     ('company', '=', company.id),
    ...     ('group.kind', '=', 'purchase'),
    ...     ('name', '=', 'IVA 21% (bienes)'),
    ...     ])
    >>> ProductCategory = Model.get('product.category')
    >>> account_category = ProductCategory(name="Account Category")
    >>> account_category.accounting = True
    >>> account_category.account_expense = expense
    >>> account_category.account_revenue = revenue
    >>> account_category.customer_taxes.append(customer_tax)
    >>> account_category.supplier_taxes.append(supplier_tax)
    >>> account_category.save()

Create product::

    >>> ProductUom = Model.get('product.uom')
    >>> unit, = ProductUom.find([('name', '=', 'Unit')])
    >>> ProductTemplate = Model.get('product.template')
    >>> template = ProductTemplate()
    >>> template.name = 'product'
    >>> template.default_uom = unit
    >>> template.type = 'service'
    >>> template.list_price = Decimal('40')
    >>> template.account_category = account_category
    >>> template.save()
    >>> product, = template.products

Create invoices::

    >>> Invoice = Model.get('account.invoice')
    >>> invoice = Invoice()
    >>> invoice.party = party
    >>> invoice.invoice_date = period.start_date
    >>> line = invoice.lines.new()
    >>> line.product = product
    >>> line.quantity = 5
    >>> line.unit_price = Decimal('40')
    >>> invoice.click('post')
    >>> invoice.total_amount
    Decimal('242.00')
    >>> invoice = Invoice()
    >>> invoice.type = 'in'
    >>> invoice.party = supplier
    >>> invoice.invoice_date = period.start_date
    >>> line = invoice.lines.new()
    >>> line.product = product
    >>> line.quantity = 5
    >>> line.unit_price = Decimal('20')
    >>> invoice.click('post')
    >>> invoice.total_amount
    Decimal('106.00')
    >>> invoice = Invoice()
    >>> invoice.type = 'in'
    >>> invoice.party = ec_supplier
    >>> invoice.invoice_date = period.start_date
    >>> line = invoice.lines.new()
    >>> line.product = product
    >>> line.quantity = 5
    >>> line.unit_price = Decimal('20')
    >>> invoice.click('post')
    >>> invoice.total_amount
    Decimal('100.00')

Generate aeat reports::

    >>> aeat = Wizard('account.reporting.aeat')
    >>> aeat.form.report = '111'
    >>> aeat.form.start_period = period
    >>> aeat.form.end_period = period
    >>> aeat.execute('choice')
    >>> extension, content, _, name = aeat.actions[0]
    >>> extension
    'txt'
    >>> with file_open('account_es/tests/111.txt') as f:
    ...     assertEqual(content, f.read())
    >>> name
    'AEAT Model 111-2018-01'

    >>> aeat = Wizard('account.reporting.aeat')
    >>> aeat.form.report = '115'
    >>> aeat.form.start_period = period
    >>> aeat.form.end_period = period
    >>> aeat.execute('choice')
    >>> extension, content, _, name = aeat.actions[0]
    >>> extension
    'txt'
    >>> with file_open('account_es/tests/115.txt') as f:
    ...     assertEqual(content, f.read())
    >>> name
    'AEAT Model 115-2018-01'

    >>> aeat = Wizard('account.reporting.aeat')
    >>> aeat.form.report = '303'
    >>> aeat.form.start_period = period
    >>> aeat.form.end_period = period
    >>> aeat.execute('choice')
    >>> extension, content, _, name = aeat.actions[0]
    >>> extension
    'txt'
    >>> with file_open('account_es/tests/303.txt') as f:
    ...     assertEqual(content, f.read())
    >>> name
    'AEAT Model 303-2018-01'

    >>> VatList = Model.get('account.reporting.vat_list_es')
    >>> context = {
    ...     'company': company.id,
    ...     'date': period.end_date,
    ...     }
    >>> with config.set_context(context):
    ...     vat_list_records = VatList.find([])
    ...     report = Report('account.reporting.aeat347')
    ...     extension, content, _, name = report.execute(vat_list_records)
    >>> extension
    'txt'
    >>> with file_open('account_es/tests/347.txt') as f:
    ...     assertEqual(content, f.read())
    >>> name
    'AEAT Model 347-...'

    >>> ECOperationList = Model.get('account.reporting.es_ec_operation_list')
    >>> context = {
    ...     'company': company.id,
    ...     'start_date': period.start_date,
    ...     'end_date': period.end_date,
    ...     }
    >>> with config.set_context(context):
    ...     records = ECOperationList.find([])
    ...     report = Report('account.reporting.aeat349')
    ...     extension, content, _, name = report.execute(records)
    >>> extension
    'txt'
    >>> with file_open('account_es/tests/349.txt') as f:
    ...     assertEqual(content, f.read())
    >>> name
    'AEAT Model 349-...'


Only one tax of intracomunitary invoices is included on VAT Book::

    >>> VatBook = Model.get('account.reporting.vat_book_es')
    >>> context = {
    ...     'company': company.id,
    ...     'fiscalyear': fiscalyear.id,
    ...     'es_vat_book_type': 'R',
    ...     }
    >>> with config.set_context(context):
    ...     records = VatBook.find([])
    >>> len(records)
    2
    >>> supplier_record, = [r for r in records if r.party == supplier]
    >>> supplier_record.base_amount
    Decimal('100.00')
    >>> supplier_record.tax_amount
    Decimal('21.00')
    >>> ec_supplier_record, = [r for r in records if r.party == ec_supplier]
    >>> ec_supplier_record.base_amount
    Decimal('100.00')
    >>> ec_supplier_record.tax_amount
    Decimal('21.00')
