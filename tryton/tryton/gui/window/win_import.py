# This file is part of Tryton.  The COPYRIGHT file at the top level of
# this repository contains the full copyright notices and license terms.
import base64
import csv
import datetime as dt
import gettext
import locale
from decimal import Decimal

from gi.repository import Gtk

import tryton.common as common
from tryton.common import IconFactory, RPCException, RPCExecute
from tryton.common.underline import set_underline
from tryton.gui.window.win_csv import WinCSV

_ = gettext
N_ = gettext.ngettext


class WinImport(WinCSV):
    "Window import"

    def __init__(self, name, model, context):
        self.name = name
        self.model = model
        self.context = context
        self.fields_data = {}
        self.fields = {}
        self.fields_invert = {}
        super().__init__()
        self.dialog.set_title(_('CSV Import: %s') % name)

        button_cancel = self.dialog.add_button(
            set_underline(_("Cancel")), Gtk.ResponseType.CANCEL)
        button_cancel.set_image(IconFactory.get_image(
                'tryton-cancel', Gtk.IconSize.BUTTON))

        button_ok = self.dialog.add_button(
            set_underline(_("Import")), Gtk.ResponseType.OK)
        button_ok.set_image(IconFactory.get_image(
                'tryton-import', Gtk.IconSize.BUTTON))

    def add_buttons(self, box):
        button_autodetect = Gtk.Button(
            label=_('_Auto-Detect'), stock=None, use_underline=True)
        button_autodetect.set_image(common.IconFactory.get_image(
                'tryton-search', Gtk.IconSize.BUTTON))
        button_autodetect.set_always_show_image(True)
        button_autodetect.connect_after('clicked', self.sig_autodetect)
        box.pack_start(
            button_autodetect, expand=False, fill=False, padding=0)

    def add_chooser(self, box):
        hbox_csv_import = Gtk.HBox()
        box.pack_start(hbox_csv_import, expand=False, fill=True, padding=4)
        label_csv_import = Gtk.Label(label=_("File to Import:"))
        hbox_csv_import.pack_start(label_csv_import, False, False, 0)
        self.import_csv_file = Gtk.FileChooserButton(title=_("Open..."))
        label_csv_import.set_mnemonic_widget(self.import_csv_file)
        hbox_csv_import.pack_start(
            self.import_csv_file, expand=True, fill=True, padding=0)

    def add_csv_header_param(self, box):
        label_csv_skip = Gtk.Label(
            label=_('Lines to Skip:'), halign=Gtk.Align.START)
        box.pack_start(label_csv_skip, expand=False, fill=True, padding=0)

        self.csv_skip = Gtk.SpinButton()
        self.csv_skip.configure(Gtk.Adjustment(
                value=0, lower=0, upper=100,
                step_increment=1, page_increment=10),
            1, 0)
        label_csv_skip.set_mnemonic_widget(self.csv_skip)
        box.pack_start(self.csv_skip, expand=False, fill=True, padding=0)

    def model_populate(self, fields, parent_node=None, prefix_field='',
            prefix_name=''):
        fields_order = list(fields.keys())
        fields_order.sort(
            key=lambda x: fields[x].get('string', ''), reverse=True)
        for field_name in fields_order:
            field = fields[field_name]
            if not field.get('readonly', False) or field_name == 'id':
                self.fields_data[prefix_field + field_name] = field
                name = field['string'] or field_name
                node = self.model1.insert(
                    parent_node, 0, [name, prefix_field + field_name])
                name = prefix_name + name
                # Only One2Many can be nested for import
                if field['type'] == 'one2many':
                    relation = field.get('relation')
                else:
                    relation = None
                self.fields[prefix_field + field_name] = (name, relation)
                self.fields_invert[name] = prefix_field + field_name
                if relation:
                    self.model1.insert(node, 0, [None, ''])
                elif field.get('translate', False):
                    for language in self.languages:
                        l_field_name = f"{field_name}:lang={language['code']}"
                        self.model1.insert(
                            node, 0, [
                                language['name'], prefix_field + l_field_name])
                        l_name = prefix_name + name + f" ({language['name']})"
                        self.fields[prefix_field + l_field_name] = (
                            l_name, relation)
                        self.fields_invert[l_name] = (
                            prefix_field + l_field_name)

    def _get_fields(self, model):
        try:
            return RPCExecute('model', model, 'fields_get', None,
                context=self.context)
        except RPCException:
            return ''

    def on_row_expanded(self, treeview, iter, path):
        child = self.model1.iter_children(iter)
        # autodetect could call for node without children
        if child is None:
            return
        if self.model1.get_value(child, 0) is None:
            prefix_field = self.model1.get_value(iter, 1)
            name, model = self.fields[prefix_field]
            self.model_populate(
                self._get_fields(model), iter,
                prefix_field + '/', name + '/')
            self.model1.remove(child)

    def sig_autodetect(self, widget=None):
        fname = self.import_csv_file.get_filename()
        if not fname:
            common.message(_('You must select an import file first.'))
            return True

        encoding = self.get_encoding()
        self.csv_skip.set_value(1)
        try:
            data = csv.reader(
                open(fname, 'r', encoding=encoding, newline=''),
                quotechar=self.get_quotechar(),
                delimiter=self.get_delimiter())
        except (IOError, UnicodeDecodeError, csv.Error) as exception:
            common.warning(str(exception), _("Detection failed"))
            return True
        self.sig_unsel_all()
        word = ''
        for line in data:
            for word in line:
                if word not in self.fields_invert and word not in self.fields:
                    iter = self.model1.get_iter_first()
                    prefix = ''
                    for parent in word.split('/')[:-1]:
                        while iter:
                            if self.model1.get_value(iter, 0) == parent or \
                                    self.model1.get_value(iter, 1) == \
                                    (prefix + parent):
                                self.on_row_expanded(self.view1, iter,
                                        self.model1.get_path(iter))
                                iter = self.model1.iter_children(iter)
                                prefix = parent + '/'
                                break
                            else:
                                iter = self.model1.iter_next(iter)

                if word in self.fields_invert:
                    name = word
                    field = self.fields_invert[word]
                elif word in self.fields:
                    name = self.fields[word][0]
                    field = word
                else:
                    common.warning(
                        _('Unknown column header "%s"') % word,
                        _('Error'))
                    return True
                num = self.model2.append()
                self.model2.set(num, 0, name, 1, field)
            break
        return True

    def sig_sel(self, *args):
        sel = self.view1.get_selection()
        sel.selected_foreach(self._sig_sel_add)

    def _sig_sel_add(self, store, path, iter):
        num = self.model2.append()
        name = self.fields[store.get_value(iter, 1)][0]
        self.model2.set(num, 0, name, 1, store.get_value(iter, 1))

    def sig_unsel(self, *args):
        store, paths = self.view2.get_selection().get_selected_rows()
        # Convert first into TreeIter before removing from the store
        iters = [store.get_iter(p) for p in paths]
        for i in iters:
            store.remove(i)

    def sig_unsel_all(self, *args):
        self.model2.clear()

    def response(self, dialog, response):
        if response == Gtk.ResponseType.OK:
            fields = []
            iter = self.model2.get_iter_first()
            while iter:
                fields.append(self.model2.get_value(iter, 1))
                iter = self.model2.iter_next(iter)

            fname = self.import_csv_file.get_filename()
            if fname:
                if not self.import_csv(fname, fields):
                    return
        self.destroy()

    def import_csv(self, fname, fields):
        # TODO: make it works with references
        skip = self.csv_skip.get_value_as_int()
        encoding = self.get_encoding()
        locale_format = self.csv_locale.get_active()
        try:
            reader = csv.reader(
                open(fname, 'r', encoding=encoding),
                quotechar=self.get_quotechar(),
                delimiter=self.get_delimiter())
            data = []
            for i, line in enumerate(reader):
                if i < skip or not line:
                    continue
                row = []
                for field, val in zip(fields, line):
                    if locale_format and val:
                        type_ = self.fields_data[field]['type']
                        if type_ == 'integer':
                            val = locale.atoi(val)
                        elif type_ == 'float':
                            val = locale.atof(val)
                        elif type_ == 'numeric':
                            val = Decimal(locale.delocalize(val))
                        elif type_ == 'date':
                            val = dt.datetime.strptime(
                                val, common.date_format()).date()
                        elif type_ == 'datetime':
                            val = dt.datetime.strptime(
                                val, common.date_format() + ' %X')
                        elif type_ == 'binary':
                            val = base64.b64decode(val)
                    row.append(val)
                data.append(row)
        except (IOError, UnicodeDecodeError, csv.Error, ValueError) \
                as exception:
            common.warning(str(exception), _("Import failed"))
            return
        try:
            count = RPCExecute(
                'model', self.model, 'import_data', fields, data,
                context=self.context)
        except RPCException:
            return
        common.message(
            N_('%d record imported.', '%d records imported.', count) % count)
        return count
