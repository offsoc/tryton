/* This file is part of Tryton.  The COPYRIGHT file at the top level of
   this repository contains the full copyright notices and license terms. */
(function() {
    'use strict';

    QUnit.test('JSON', function() {
        var tests = {
            'array': [1, 2, 3],
            'object': {
                'foo': true,
                'bar': false
            },
            'datetime': Sao.DateTime(2012, 11, 29, 19, 59, 10),
            'date': Sao.Date(2012, 11, 29),
            'decimal': new Sao.Decimal(1.1),
            'null': null
        };
        for (var name in tests) {
            var test = tests[name];
            var result = Sao.rpc.convertJSONObject(jQuery.parseJSON(
                    JSON.stringify(Sao.rpc.prepareObject(test))));
            var ok_;
            if (name == 'null') {
                ok_ = test == result;
            } else {
                ok_ = test.toString() == result.toString();
            }
            QUnit.assert.ok(ok_, 'JSON ' + name);
        }
    });

    QUnit.test('PYSON Decoder', function() {
        var decoder = new Sao.PYSON.Decoder();
        QUnit.assert.strictEqual(decoder.decode('null'), null, "decode('null')");
    });

    QUnit.test('PYSON Encoder', function() {
        var encoder = new Sao.PYSON.Encoder();
        var none;
        var decimal = Sao.Decimal(1.1);
        var pyson_decimal = 1.1;
        var date = Sao.Date(2002, 0, 1);
        var datetime = Sao.DateTime(2002, 0, 1, 12, 30, 0, 0);
        var pyson_date = new Sao.PYSON.Date(2002, 1, 1).pyson();
        pyson_date.start = null;
        var pyson_datetime = new Sao.PYSON.DateTime(
            2002, 1, 1, 12, 30, 0, 0).pyson();
        pyson_datetime.start = null;
        var timedelta = Sao.TimeDelta(1, 2, 3);
        var pyson_timedelta = new Sao.PYSON.TimeDelta(1, 2, 3000).pyson();
        var array = ["create_date", '>=', date];
        var pyson_array = ["create_date", '>=', pyson_date];
        var statement = new Sao.PYSON.Equal(date, date);
        var pyson_statement = {
            '__class__': 'Equal',
            's1': pyson_date,
            's2': pyson_date,
        };
        QUnit.assert.strictEqual(encoder.encode(), 'null', "encode()");
        QUnit.assert.strictEqual(encoder.encode(none), 'null', "encode(none)");
        QUnit.assert.strictEqual(encoder.encode(null), 'null', "encode()");
        QUnit.assert.strictEqual(encoder.encode(decimal),
            JSON.stringify(pyson_decimal), "encode(decimal)");
        QUnit.assert.strictEqual(encoder.encode(date),
            JSON.stringify(pyson_date), "encode(date)");
        QUnit.assert.strictEqual(encoder.encode(datetime),
            JSON.stringify(pyson_datetime), "encode(datetime)");
        QUnit.assert.strictEqual(encoder.encode(timedelta),
            JSON.stringify(pyson_timedelta), "encode(timedelta)");
        QUnit.assert.strictEqual(encoder.encode(array),
            JSON.stringify(pyson_array), "encode(array)");
        QUnit.assert.strictEqual(encoder.encode(statement),
            JSON.stringify(pyson_statement), "encode(statement)");
    });

    QUnit.test('PYSON.Eval', function() {
        var value;
        value = new Sao.PYSON.Eval('test').pyson();
        QUnit.assert.strictEqual(value.__class__, 'Eval', "Eval('test').pyson()");
        QUnit.assert.strictEqual(value.v, 'test', "Eval('test').pyson()");
        QUnit.assert.strictEqual(value.d, '', "Eval('test').pyson()");
        value = new Sao.PYSON.Eval('test', 'foo').pyson();
        QUnit.assert.strictEqual(value.__class__, 'Eval',
            "Eval('test', 'foo').pyson()");
        QUnit.assert.strictEqual(value.v, 'test', "Eval('test', 'foo').pyson()");
        QUnit.assert.strictEqual(value.d, 'foo', "Eval('test', 'foo').pyson()");
        QUnit.assert.strictEqual(new Sao.PYSON.Eval('test', 'foo').toString(),
                "Eval(\"test\", \"foo\")");

        QUnit.assert.ok(Sao.common.compare(new Sao.PYSON.Eval('test', 'foo').types(),
                [typeof 'foo']), "Eval('test', 'foo').types()");
        QUnit.assert.ok(Sao.common.compare(new Sao.PYSON.Eval('test', 1).types(),
                [typeof 1]), "Eval('test', 1).types()");

        var eval_;
        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Eval('test', 0));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder({test: 1}).decode(eval_), 1,
            "decode(Eval('test', 0))");
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), 0,
            "decode(Eval('test', 0))");
        QUnit.assert.strictEqual(
            new Sao.PYSON.Decoder({test: undefined}).decode(eval_), 0,
            "decode(Eval('test', 0))");
    });

    QUnit.test('PYSON Not', function() {
        var value = new Sao.PYSON.Not(true).pyson();
        QUnit.assert.strictEqual(value.__class__, 'Not', 'Not(true).pyson()');
        QUnit.assert.strictEqual(value.v, true, 'Not(true).pyson()');

        QUnit.assert.ok(Sao.common.compare(new Sao.PYSON.Not(true).types(),
                ['boolean']), 'Not(true).types()');

        var eval_;
        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Not(true));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
            'decode(Not(true))');
        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Not(false));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
            'decode(Not(false))');
        QUnit.assert.strictEqual(new Sao.PYSON.Not(true).toString(),
                "Not(true)");

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Not({}));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
            "decode(Not({}))");

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Not({
            'a': 1,
        }));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
            "decode(Not({'a': 1}))");

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Not([]));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
            "decode(Not([]))");

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Not(['a']));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
            "decode(Not(['a']))");
    });

    QUnit.test('PYSON Bool', function() {
        var value = new Sao.PYSON.Bool('test').pyson();
        QUnit.assert.strictEqual(value.__class__, 'Bool', "Bool('test').pyson()");
        QUnit.assert.strictEqual(value.v, 'test', "Bool('test').pyson()");

        QUnit.assert.ok(Sao.common.compare(new Sao.PYSON.Bool('test').types(),
                ['boolean']), "Bool('test').types()");

        var eval_;
        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Bool(true));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
            'decode(Bool(true))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Bool(false));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
            'decode(Bool(false))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Bool('test'));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
            "decode(Bool('test'))");

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Bool(''));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
            "decode(Bool(''))");

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Bool(1));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
            'decode(Bool(1))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Bool(0));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
            'decode(Bool(0))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Bool(['test']));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
            "decode(Bool(['test']))");

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Bool([]));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
            'decode(Bool([]))');

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.Bool({foo: 'bar'}));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
            "decode(Bool({foo: 'bar'}))");

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Bool({}));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
            'decode(Bool({}))');

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.Bool(new Sao.PYSON.Eval('value')));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder({value: Sao.Time(0)})
                .decode(eval_), false, "decode(Bool(Sao.Time(0)))");
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder({value: Sao.Time(1)})
                .decode(eval_), true, "decode(Bool(Sao.Time(1)))");
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder({value: Sao.TimeDelta()})
                .decode(eval_), false, "decode(Bool(Sao.TimeDelta()))");
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder({value: Sao.TimeDelta(1)})
                .decode(eval_), true, "decode(Bool(Sao.TimeDelta(1)))");
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder({value: new Sao.Decimal(0)})
                .decode(eval_), false, "decode(Bool(Sao.Decimal(0)))");
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder({value: new Sao.Decimal(1)})
                .decode(eval_), true, "decode(Bool(Sao.Decimal(1)))");

        QUnit.assert.strictEqual(new Sao.PYSON.Bool('test').toString(),
                "Bool(\"test\")");
    });

    QUnit.test('PYSON And', function() {
        var value = new Sao.PYSON.And(true, false).pyson();
        QUnit.assert.strictEqual(value.__class__, 'And', 'And(true, false).pyson()');
        QUnit.assert.ok(Sao.common.compare(value.s, [true, false]),
            'And([true, false]).pyson()');

        QUnit.assert.throws(function() {
            new Sao.PYSON.And(true);
        }, 'And(true)');
        QUnit.assert.throws(function() {
            new Sao.PYSON.And();
        }, 'And()');

        QUnit.assert.ok(Sao.common.compare(new Sao.PYSON.And(true, false).types(),
                    ['boolean']), 'And(true, false).types()');

        var eval_;
        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.And(true, true));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
                'decode(And(true, true))');

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.And(true, true, true));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
                'decode(And(true, true, true))');

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.And(true, false));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
                'decode(And(true, false))');

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.And(false, true));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
                'decode(And(false, true))');

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.And(false, false));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
                'decode(And(false, false))');

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.And(false, false, false));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
                'decode(And(false, false, false))');

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.And(true, false, false));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
                'decode(And(true, false, false))');

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.And(false, true, false));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
                'decode(And(false, true, false))');

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.And(false, false, true));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
                'decode(And(false, false, true))');
        QUnit.assert.strictEqual(new Sao.PYSON.And(false, true, true).toString(),
                "And(false, true, true)");
    });

    QUnit.test('PYSON Or', function() {
        var value = new Sao.PYSON.Or(true, false).pyson();
        QUnit.assert.strictEqual(value.__class__, 'Or', 'Or(true, false).pyson()');
        QUnit.assert.ok(Sao.common.compare(value.s, [true, false]),
            'Or(true, false).pyson()');

        QUnit.assert.throws(function() {
            new Sao.PYSON.Or(true);
        }, 'Or(true)');
        QUnit.assert.throws(function() {
            new Sao.PYSON.Or();
        }, 'Or()');

        QUnit.assert.ok(Sao.common.compare(new Sao.PYSON.Or(true, false).types(),
                    ['boolean']), 'Or(true, false).types()');

        var eval_;
        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.Or(true, true));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
                'decode(Or(true, true))');

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.Or(true, true, true));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
                'decode(Or(true, true, true))');

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.Or(true, false));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
                'decode(Or(true, false))');

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.Or(false, true));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
                'decode(Or(false, true))');

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.Or(false, false));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
                'decode(Or(false, false))');

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.Or(false, false, false));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
                'decode(Or(false, false, false))');

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.Or(true, false, false));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
                'decode(Or(true, false, false))');

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.Or(false, true, false));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
                'decode(Or(false, true, false))');

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.Or(false, false, true));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
                'decode(Or(false, false, true))');
        QUnit.assert.strictEqual(new Sao.PYSON.Or(false, true, true).toString(),
                "Or(false, true, true)");
    });

    QUnit.test('PYSON Equal', function() {
        var value = new Sao.PYSON.Equal('test', 'test').pyson();
        QUnit.assert.strictEqual(value.__class__, 'Equal',
            "Equal('test', 'test').pyson()");
        QUnit.assert.strictEqual(value.s1, 'test', "Equal('test', 'test').pyson()");
        QUnit.assert.strictEqual(value.s2, 'test', "Equal('test', 'test').pyson()");

        QUnit.assert.throws(function() {
            new Sao.PYSON.Equal('test', true);
        }, 'statements must have the same type');

        QUnit.assert.ok(Sao.common.compare(new Sao.PYSON.Equal('test', 'test').types(),
                ['boolean']), "Equal('test', 'test').types()");

        var eval_;
        eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.Equal('test', 'test'));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
            "decode(Equal('test', 'test'))");

        eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.Equal('foo', 'bar'));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
            "decode(Equal('foo', 'bar'))");

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.Equal(['test'], ['test']));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
                "decode(Equal(['test'], ['test']))");

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.Equal(['foo'], ['bar']));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
                "decode(Equal(['foo'], ['bar']))");
        QUnit.assert.strictEqual(new Sao.PYSON.Equal('foo', 'bar').toString(),
                "Equal(\"foo\", \"bar\")");

        eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.Equal(
                new Sao.PYSON.Date(2017, 1, 1), new Sao.PYSON.Date(2017, 1, 1)));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
            "decode(Equal(Date(2017, 1, 1), Date(2017, 1, 1)))");

        eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.Equal(
                new Sao.PYSON.Date(2017, 1, 1), new Sao.PYSON.Date(2017, 1, 2)));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
            "decode(Equal(Date(2017, 1, 1), Date(2017, 1, 2)))");

        eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.Equal(
                new Sao.PYSON.DateTime(2017, 1, 1, 12, 0, 0, 0),
                new Sao.PYSON.DateTime(2017, 1, 1, 12, 0, 0, 0)));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
            "decode(Equal(DateTime(2017, 1, 1, 12, 0, 0, 0), " +
            "DateTime(2017, 1, 1, 12, 0, 0, 0)))");

        eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.Equal(
                new Sao.PYSON.DateTime(2017, 1, 1, 12, 0, 0, 0),
                new Sao.PYSON.DateTime(2017, 1, 1, 14, 0, 0, 0)));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
            "decode(Equal(DateTime(2017, 1, 1, 12, 0, 0, 0), " +
            "DateTime(2017, 1, 1, 14, 0, 0, 0)))");

        eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.Equal(
                new Sao.PYSON.DateTime(2017, 1, 1, 0, 0, 0, 0),
                new Sao.PYSON.Date(2017, 1, 1)));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
            "decode(Equal(DateTime(2017, 1, 1, 0, 0, 0, 0), " +
            "Date(2017, 1, 1)))");
    });

    QUnit.test('PYSON Greater', function() {
        var value = new Sao.PYSON.Greater(1, 0).pyson();
        QUnit.assert.strictEqual(value.__class__, 'Greater', 'Greater(1, 0).pyson()');
        QUnit.assert.strictEqual(value.s1, 1, 'Greater(1, 0).pyson()');
        QUnit.assert.strictEqual(value.s2, 0, 'Greater(1, 0).pyson()');
        QUnit.assert.strictEqual(value.e, false, 'Greater(1, 0).pyson()');

        QUnit.assert.throws(function() {
            new Sao.PYSON.Greater('test', 0);
        }, 'statement must be an integer, float, date or datetime');
        QUnit.assert.throws(function() {
            new Sao.PYSON.Greater(1, 'test');
        }, 'statement must be an integer, float, date or datetime');
        QUnit.assert.throws(function() {
            new Sao.PYSON.Greater(new Sao.PYSON.Eval('foo'), 0);
        }, 'statement must be an integer, float, date or datetime');
        QUnit.assert.throws(function() {
            new Sao.PYSON.Greater(Sao.PYSON.DateTime(), 'test');
        }, 'statement must be an integer, float, date or datetime');
        QUnit.assert.throws(function() {
            new Sao.PYSON.Greater('test', Date());
        }, 'statement must be an integer, float, date or datetime');

        QUnit.assert.ok(Sao.common.compare(new Sao.PYSON.Greater(1, 0).types(),
                ['boolean']), 'Greater(1, 0).types()');

        var eval_;
        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Greater(1, 0));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
                'decode(Greater(1, 0))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Greater(0, 1));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
                'decode(Greater(0, 1))');

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.Greater(1, 0, true));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
                'decode(Greater(1, 0, true))');

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.Greater(0, 1, true));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
                'decode(Greater(0, 1, true))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Greater(1, 1));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
                'decode(Greater(1, 1))');

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.Greater(1, 1, true));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
                'decode(Greater(1, 1, true))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Greater(null, 1));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
                'decode(Greater(null, 1))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Greater(1, null));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
                'decode(Greater(1, null))');
        QUnit.assert.strictEqual(new Sao.PYSON.Greater(1, 0).toString(),
                "Greater(1, 0, false)");

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Greater(
            new Sao.PYSON.DateTime(2020, 1, 1, 0, 0, 0, 0),
            Sao.Date(2020, 0, 2)));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
            'decode(Greater(PYSON.DateTime(2020, 1, 1, 0, 0, 0, 0), ' +
            'Date(2020, 0, 2)))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Greater(
            new Sao.PYSON.DateTime(2020, 1, 1, 0, 0, 0, 1000),
            Sao.Date(2020, 0, 1)));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
            'decode(Greater(PYSON.DateTime(2020, 1, 1, 0, 0, 0, 1000), ' +
            'Date(2020, 0, 1)))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Greater(
            new Sao.PYSON.DateTime(2020, 1, 1, 0, 0, 0, 0),
            Sao.Date(2020, 0, 1), true));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
            'decode(Greater(PYSON.DateTime(2020, 1, 1, 0, 0, 0, 0), ' +
            'Date(2020, 0, 1), true))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Greater(
            new Sao.PYSON.DateTime(2020, 1, 1, 0, 0, 0, 0),
            new Sao.PYSON.DateTime(2020, 1, 1, 0, 0, 0, 0)));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
            'decode(Greater(PYSON.DateTime(2020, 1, 1, 0, 0, 0, 0), ' +
            'PYSON.DateTime(2020, 1, 1, 0, 0, 0, 0, 0)))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Greater(
            new Sao.PYSON.Date(2020, 1, 1),
            Sao.Date(2020, 0, 1)));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
            'decode(Greater(PYSON.Date(2020, 1, 1), Date(2020, 0, 1)))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Greater(
            new Sao.PYSON.Eval('foo', Sao.Date(2020, 0, 1)),
            Sao.Date(2020, 0, 1)));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
            'decode(Greater(PYSON.Eval("foo", Date(2020, 1, 1)), ' +
            'Date(2020, 0, 1)))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Greater(
            new Sao.PYSON.Eval('foo', new Sao.PYSON.Date(2020, 1, 1)),
            new Sao.PYSON.Date(2020, 1, 1)));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
            'decode(Greater(PYSON.Eval("foo", PYSON.Date(2020, 1, 1)), ' +
            'PYSON.Date(2020, 1, 1)))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Greater(
            new Sao.PYSON.Date(2020, 1, 1),
            new Sao.PYSON.DateTime(2020, 1, 1, 0, 0, 0, 1)));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
            'decode(Greater(PYSON.Date(2020, 1, 1), ' +
            'PYSON.DateTime(2020, 1, 1, 0, 0, 0, 1)))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Greater(
            new Sao.PYSON.DateTime(2020, 1, 1, 0, 0, 0, 1),
            new Sao.PYSON.Date(2020, 1, 1), true));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
            'decode(Greater(PYSON.DateTime(2020, 1, 1, 0, 0, 0, 1), ' +
            'PYSON.Date(2020, 1, 1), true))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Greater(
            new Sao.PYSON.DateTime(2020, 1, 1, 0, 0, 0, 0), 90000));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
            'decode(Greater(PYSON.DateTime(2020, 1, 1, 0, 0, 0, 0), 90000))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Greater(
            new Sao.PYSON.TimeDelta(5, 2),
            new Sao.PYSON.TimeDelta(4, 2)));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
            'decode(Greater(PYSON.TimeDelta(5, 2), PYSON.TimeDelta(4, 2)))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Greater(
            new Sao.PYSON.TimeDelta(4, 2),
            new Sao.PYSON.TimeDelta(5, 2)));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
            'decode(Greater(PYSON.TimeDelta(4, 2), PYSON.TimeDelta(5, 2)))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Greater(
            new Sao.PYSON.TimeDelta(5, 2),
            Sao.TimeDelta(4, 2)));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
            'decode(Greater(PYSON.TimeDelta(5, 2), Sao.TimeDelta(4, 2)))');

        eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.Greater(new Sao.PYSON.Eval('i', 0), 0));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder({i: 1}).decode(eval_), true,
            "decode(Greater(Eval('i', 0)))");
    });

    QUnit.test('PYSON Less', function() {
        var value = new Sao.PYSON.Less(1, 0).pyson();
        QUnit.assert.strictEqual(value.__class__, 'Less', 'Less(1, 0).pyson()');
        QUnit.assert.strictEqual(value.s1, 1, 'Less(1, 0).pyson()');
        QUnit.assert.strictEqual(value.s2, 0, 'Less(1, 0).pyson()');
        QUnit.assert.strictEqual(value.e, false, 'Less(1, 0).pyson()');

        QUnit.assert.throws(function() {
            new Sao.PYSON.Less('test', 0);
        }, 'statement must be an integer, float, date or datetime');
        QUnit.assert.throws(function() {
            new Sao.PYSON.Less(1, 'test');
        }, 'statement must be an integer, float, date or datetime');
        QUnit.assert.throws(function() {
            new Sao.PYSON.Less(1, 'test');
        }, 'statement must be an integer, float, date or datetime');
        QUnit.assert.throws(function() {
            new Sao.PYSON.Less(new Sao.PYSON.Eval('foo'), 0);
        }, 'statement must be an integer, float, date or datetime');
        QUnit.assert.throws(function() {
            new Sao.PYSON.Less(Sao.PYSON.DateTime(), 'test');
        }, 'statement must be an integer, float, date or datetime');
        QUnit.assert.throws(function() {
            new Sao.PYSON.Less('test', Date());
        }, 'statement must be an integer, float, date or datetime');

        QUnit.assert.ok(Sao.common.compare(new Sao.PYSON.Less(1, 0).types(),
                ['boolean']), 'Less(1, 0).types()');

        var eval_;
        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Less(1, 0));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
                'decode(Less(1, 0))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Less(0, 1));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
                'decode(Less(0, 1))');

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.Less(1, 0, true));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
                'decode(Less(1, 0, true))');

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.Less(0, 1, true));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
                'decode(Less(0, 1, true))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Less(1, 1));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
                'decode(Less(1, 1))');

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.Less(1, 1, true));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
                'decode(Less(1, 1, true))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Less(null, 1));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
                'decode(Less(null, 1))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Less(1, null));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
                'decode(Less(1, null))');
        QUnit.assert.strictEqual(new Sao.PYSON.Less(0, 1).toString(),
                "Less(0, 1, false)");

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Less(
            new Sao.PYSON.DateTime(2020, 1, 1, 0, 0, 0, 1000),
            Sao.Date(2020, 0, 1)));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
            'decode(Less(PYSON.DateTime(2020, 1, 1, 0, 0, 0, 1000), ' +
            'Date(2020, 0, 1)))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Less(
            new Sao.PYSON.DateTime(2020, 1, 1, 0, 0, 0, 0),
            Sao.Date(2020, 0, 2), true));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
            'decode(Less(PYSON.DateTime(2020, 1, 1, 0, 0, 0, 0), ' +
            'Date(2020, 0, 2), true))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Less(
            new Sao.PYSON.DateTime(2020, 1, 1, 0, 0, 0, 0),
            new Sao.PYSON.DateTime(2020, 1, 1, 0, 0, 0, 0)));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
            'decode(Less(PYSON.DateTime(2020, 1, 1, 0, 0, 0, 0), ' +
            'PYSON.DateTime(2020, 1, 1, 0, 0, 0, 0)))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Less(
            new Sao.PYSON.Date(2020, 1, 1),
            Sao.Date(2020, 0, 2)));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
            'decode(Less(PYSON.Date(2020, 1, 1), Date(2020, 0, 2)))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Less(
            new Sao.PYSON.Date(2020, 1, 1),
            new Sao.PYSON.DateTime(2020, 1, 1, 0, 0, 0, 1000)));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
            'decode(Less(PYSON.Date(2020, 1, 1), ' +
            'PYSON.DateTime(2020, 1, 1, 0, 0, 1000)))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Less(
            new Sao.PYSON.DateTime(2020, 1, 1, 0, 0, 0, 0),
            new Sao.PYSON.Date(2020, 0, 1), true));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
            'decode(Less(PYSON.DateTime(2020, 1, 1, 0, 0, 0, 0), ' +
            'PYSON.Date(2020, 1, 1), true))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Less(
            new Sao.PYSON.DateTime(2020, 1, 1, 0, 0, 0, 0), 90000));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
            'decode(Less(PYSON.DateTime(2020, 1, 1, 0, 0, 0, 0), 90000))');

    });

    QUnit.test('PYSON If', function() {
        var value = new Sao.PYSON.If(true, 'foo', 'bar').pyson();
        QUnit.assert.strictEqual(value.__class__, 'If', "If(true, 'foo', 'bar')");
        QUnit.assert.strictEqual(value.c, true, "If(true, 'foo', 'bar')");
        QUnit.assert.strictEqual(value.t, 'foo', "If(true, 'foo', 'bar')");
        QUnit.assert.strictEqual(value.e, 'bar', "If(true, 'foo', 'bar')");

        QUnit.assert.ok(Sao.common.compare(
                new Sao.PYSON.If(true, 'foo', 'bar').types(),
                [typeof 'foo']), "If(true, 'foo', 'bar').types()");
        QUnit.assert.ok(Sao.common.compare(
                new Sao.PYSON.If(true, false, true).types(),
                [typeof true]), 'If(true, false, true).types()');
        QUnit.assert.ok(Sao.common.compare(
                new Sao.PYSON.If(true, 'foo', false).types(),
                [typeof 'foo', typeof true]), "If(true, 'foo', false).types()");

        var eval_;
        eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.If(true, 'foo', 'bar'));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), 'foo',
                "decode(If(true, 'foo', 'bar'))");

        eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.If(false, 'foo', 'bar'));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), 'bar',
                "decode(If(false, 'foo', 'bar'))");
        QUnit.assert.strictEqual(new Sao.PYSON.If(true, 'foo', 'bar').toString(),
                "If(true, \"foo\", \"bar\")");
    });

    QUnit.test('PYSON Get', function() {
        var value = new Sao.PYSON.Get({foo: 'bar'}, 'foo', 'default').pyson();
        QUnit.assert.strictEqual(value.__class__, 'Get',
            "Get({foo: 'bar'}, 'foo', 'default').pyson()");
        QUnit.assert.strictEqual(value.v.foo, 'bar',
            "Get({foo: 'bar'}, 'foo', 'default').pyson()");
        QUnit.assert.strictEqual(value.k, 'foo',
            "Get({foo: 'bar'}, 'foo', 'default').pyson()");
        QUnit.assert.strictEqual(value.d, 'default',
            "Get({foo: 'bar'}, 'foo', 'default').pyson()");

        QUnit.assert.throws(function() {
            new Sao.PYSON.Get('test', 'foo', 'default');
        }, 'obj must be a dict');
        QUnit.assert.throws(function() {
            new Sao.PYSON.Get({}, 1, 'default');
        }, 'key must be a string');

        QUnit.assert.ok(Sao.common.compare(
                new Sao.PYSON.Get({}, 'foo', 'default').types(),
                [typeof '']), "Get({}, 'foo', 'default').types()");
        QUnit.assert.ok(Sao.common.compare(new Sao.PYSON.Get({}, 'foo', true).types(),
                [typeof true]), "Get({}, 'foo', true).types()");

        var eval_;
        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.Get({foo: 'bar'}, 'foo', 'default'));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), 'bar',
                "decode(Get({foo: 'bar'}, 'foo', 'default'))");

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.Get({foo: 'bar'}, 'test', 'default'));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), 'default',
                "decode(Get({foo: 'bar'}, 'test', 'default'))");

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.Get({}, 'foo', 'default'));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), 'default',
                "decode(Get({}, 'foo', 'default'))");
        QUnit.assert.strictEqual(new Sao.PYSON.Get(
                {'foo': 'bar'}, 'foo', 'default').toString(),
            'Get({"foo": "bar"}, "foo", "default")');

        QUnit.assert.strictEqual(
            new Sao.PYSON.Eval('foo', {}).get('bar').toString(),
            'Eval("foo", {}).get("bar")');
    });

    QUnit.test('PYSON In', function() {
        var value = new Sao.PYSON.In('foo', {foo: 'bar'}).pyson();
        QUnit.assert.strictEqual(value.__class__, 'In',
            "In('foo', {foo: 'bar'}).pyson()");
        QUnit.assert.strictEqual(value.k, 'foo',
            "In('foo', {foo: 'bar'}).pyson()");
        QUnit.assert.strictEqual(value.v.foo, 'bar',
            "In('foo', {foo: 'bar'}).pyson()");

        QUnit.assert.throws(function() {
            new Sao.PYSON.In({}, {});
        }, 'key must be a string or a number');
        QUnit.assert.throws(function() {
            new Sao.PYSON.In('test', 'foo');
        }, 'obj must be a dict or a list');

        QUnit.assert.ok(Sao.common.compare(new Sao.PYSON.In('foo', {}).types(),
                ['boolean']), "In('foo', {}).types()");

        var eval_;
        eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.In('foo', {foo: 'bar'}));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
                "decode(In('foo', {foo: 'bar'}))");

        eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.In(new Sao.PYSON.Eval('test', 'foo'), {foo: 'bar'}));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
                "decode(In(Eval('test', 'foo'), {foo: 'bar'}))");

        eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.In('1', {1: 'bar'}));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
                "decode(In('1', {1: 'bar'}))");

        eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.In('test', {foo: 'bar'}));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
                "decode(In('test', {foo: 'bar'}))");

        eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.In(new Sao.PYSON.Eval('foo', 'test'), {foo: 'bar'}));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
                "decode(In(Eval('foo', 'test'), {foo: 'bar'}))");

        eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.In('foo', ['foo']));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
                "decode(In('foo', ['foo']))");

        eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.In(1, [1]));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), true,
                'decode(In(1, [1]))');

        eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.In('test', ['foo']));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
                "decode(In('test', ['foo']))");

        eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.In(1, [2]));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
                'decode(In(1, [2]))');

        eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.In('test', []));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), false,
                "decode(In('test', []))");

        eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.In('test', new Sao.PYSON.Eval('foo', [])));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder({'foo': null}).decode(eval_),
            false, "decode(In('test', Eval('foo', [])))");

        QUnit.assert.strictEqual(new Sao.PYSON.In('foo', ['foo', 'bar']).toString(),
                'In("foo", ["foo", "bar"])');

        QUnit.assert.strictEqual(
            new Sao.PYSON.Eval('foo').in_(['foo', 'bar']).toString(),
            'Eval("foo").in_(["foo", "bar"])');
    });

    QUnit.test('PYSON Date', function() {
        var value = new Sao.PYSON.Date(2010, 1, 12, -1, 12, -7).pyson();
        QUnit.assert.strictEqual(value.__class__, 'Date',
            'Date(2010, 1, 12, -1, 12, -7).pyson()');
        QUnit.assert.strictEqual(value.y, 2010,
            'Date(2010, 1, 12, -1, 12, -7).pyson()');
        QUnit.assert.strictEqual(value.M, 1,
            'Date(2010, 1, 12, -1, 12, -7).pyson()');
        QUnit.assert.strictEqual(value.d, 12,
            'Date(2010, 1, 12, -1, 12, -7).pyson()');
        QUnit.assert.strictEqual(value.dy, -1,
            'Date(2010, 1, 12, -1, 12, -7).pyson()');
        QUnit.assert.strictEqual(value.dM, 12,
            'Date(2010, 1, 12, -1, 12, -7).pyson()');
        QUnit.assert.strictEqual(value.dd, -7,
            'Date(2010, 1, 12, -1, 12, -7).pyson()');

        QUnit.assert.throws(function() {
            new Sao.PYSON.Date('test', 1, 12, -1, 12, -7);
        }, 'year must be an integer or None');
        QUnit.assert.throws(function() {
            new Sao.PYSON.Date(2010, 'test', 12, -1, 12, -7);
        }, 'month must be an integer or None');
        QUnit.assert.throws(function() {
            new Sao.PYSON.Date(2010, 1, 'test', -1, 12, -7);
        }, 'day must be an integer or None');
        QUnit.assert.throws(function() {
            new Sao.PYSON.Date(2010, 1, 12, 'test', 12, -7);
        }, 'delta_years must be an integer or None');
        QUnit.assert.throws(function() {
            new Sao.PYSON.Date(2010, 1, 12, -1, 'test', -7);
        }, 'delta_months must be an integer or None');
        QUnit.assert.throws(function() {
            new Sao.PYSON.Date(2010, 1, 12, -1, 12, 'test');
        }, 'delta_days must be an integer or None');

        QUnit.assert.ok(Sao.common.compare(
                    new Sao.PYSON.Date(2010, 1, 12, -1, 12, -7).types(),
                    ['object']), 'Date(2010, 1, 12, -1, 12, -7).types()');

        var eval_;
        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.Date(2010, 1, 12));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_).valueOf(),
                new Date(2010, 0, 12).valueOf());

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.Date(2010, 1, 12, -1));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_).valueOf(),
                new Date(2009, 0, 12).valueOf());

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.Date(2010, 1, 12, 0, 12));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_).valueOf(),
                new Date(2011, 0, 12).valueOf());

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.Date(2010, 1, 12, 0, 0, -7));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_).valueOf(),
                new Date(2010, 0, 5).valueOf());

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.Date(2010, 2, 22));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_).valueOf(),
                new Date(2010, 1, 22).valueOf());

        QUnit.assert.strictEqual(
            new Sao.PYSON.Date(2010, 1, 12, -1, 12, -7).toString(),
            'Date(2010, 1, 12, -1, 12, -7, null)');
    });

    QUnit.test('PYSON Date start', function() {
        var eval_;

        eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.Date(
                undefined, undefined, undefined,
                undefined, undefined, undefined,
                new Sao.PYSON.Eval('date')));
        var date = Sao.Date(2000, 1, 1);

        QUnit.assert.strictEqual(new Sao.PYSON.Decoder(
            {'date': date}).decode(eval_).valueOf(), date.valueOf());

        eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.Date(
                undefined, undefined, undefined,
                undefined, undefined, undefined,
                new Sao.PYSON.Eval('datetime')));
        var datetime = Sao.DateTime(2000, 1, 1, 12, 0);

        QUnit.assert.strictEqual(new Sao.PYSON.Decoder(
            {'datetime': datetime}).decode(eval_).valueOf(),
            Sao.Date(2000, 1, 1).valueOf());

        eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.Date(
                undefined, undefined, undefined,
                undefined, undefined, undefined,
                new Sao.PYSON.Eval('foo')));

        QUnit.assert.strictEqual(new Sao.PYSON.Decoder(
            {'foo': 'bar'}).decode(eval_).valueOf(),
            Sao.Date().valueOf());
    });

    QUnit.test('PYSON DateTime', function() {
        var value = new Sao.PYSON.DateTime(2010, 1, 12, 10, 30, 20, 0,
            -1, 12, -7, 2, 15, 30, 1).pyson();
        QUnit.assert.strictEqual(value.__class__, 'DateTime',
            'Date(2010, 1, 12, 10, 30, 20, 0, -1, 12, -7, 2, 15, 30, 1)' +
            '.pyson()');
        QUnit.assert.strictEqual(value.y, 2010,
            'Date(2010, 1, 12, 10, 30, 20, 0, -1, 12, -7, 2, 15, 30, 1)' +
            '.pyson()');
        QUnit.assert.strictEqual(value.M, 1,
            'Date(2010, 1, 12, 10, 30, 20, 0, -1, 12, -7, 2, 15, 30, 1)' +
            '.pyson()');
        QUnit.assert.strictEqual(value.d, 12,
            'Date(2010, 1, 12, 10, 30, 20, 0, -1, 12, -7, 2, 15, 30, 1)' +
            '.pyson()');
        QUnit.assert.strictEqual(value.h, 10,
            'Date(2010, 1, 12, 10, 30, 20, 0, -1, 12, -7, 2, 15, 30, 1)' +
            '.pyson()');
        QUnit.assert.strictEqual(value.m, 30,
            'Date(2010, 1, 12, 10, 30, 20, 0, -1, 12, -7, 2, 15, 30, 1)' +
            '.pyson()');
        QUnit.assert.strictEqual(value.s, 20,
            'Date(2010, 1, 12, 10, 30, 20, 0, -1, 12, -7, 2, 15, 30, 1)' +
            '.pyson()');
        QUnit.assert.strictEqual(value.ms, 0,
            'Date(2010, 1, 12, 10, 30, 20, 0, -1, 12, -7, 2, 15, 30, 1)' +
            '.pyson()');
        QUnit.assert.strictEqual(value.dy, -1,
            'Date(2010, 1, 12, 10, 30, 20, 0, -1, 12, -7, 2, 15, 30, 1)' +
            '.pyson()');
        QUnit.assert.strictEqual(value.dM, 12,
            'Date(2010, 1, 12, 10, 30, 20, 0, -1, 12, -7, 2, 15, 30, 1)' +
            '.pyson()');
        QUnit.assert.strictEqual(value.dd, -7,
            'Date(2010, 1, 12, 10, 30, 20, 0, -1, 12, -7, 2, 15, 30, 1)' +
            '.pyson()');
        QUnit.assert.strictEqual(value.dh, 2,
            'Date(2010, 1, 12, 10, 30, 20, 0, -1, 12, -7, 2, 15, 30, 1)' +
            '.pyson()');
        QUnit.assert.strictEqual(value.dm, 15,
            'Date(2010, 1, 12, 10, 30, 20, 0, -1, 12, -7, 2, 15, 30, 1)' +
            '.pyson()');
        QUnit.assert.strictEqual(value.ds, 30,
            'Date(2010, 1, 12, 10, 30, 20, 0, -1, 12, -7, 2, 15, 30, 1)' +
            '.pyson()');
        QUnit.assert.strictEqual(value.dms, 1,
            'Date(2010, 1, 12, 10, 30, 20, 0, -1, 12, -7, 2, 15, 30, 1)' +
            '.pyson()');

        QUnit.assert.throws(function() {
            new Sao.PYSON.DateTime('test', 1, 12, 10, 30, 20, 0,
                -1, 12, -7, 2, 15, 30, 1);
        }, 'year must be an integer or None');
        QUnit.assert.throws(function() {
            new Sao.PYSON.DateTime(2010, 'test', 12, 10, 30, 20, 0,
                -1, 12, -7, 2, 15, 30, 1);
        }, 'month must be an integer or None');
        QUnit.assert.throws(function() {
            new Sao.PYSON.DateTime(2010, 1, 'test', 10, 30, 20, 0,
                -1, 12, -7, 2, 15, 30, 1);
        }, 'day must be an integer or None');
        QUnit.assert.throws(function() {
            new Sao.PYSON.DateTime(2010, 1, 12, 'test', 30, 20, 0,
                -1, 12, -7, 2, 15, 30, 1);
        }, 'hour must be an integer or None');
        QUnit.assert.throws(function() {
            new Sao.PYSON.DateTime(2010, 1, 12, 10, 'test', 20, 0,
                -1, 12, -7, 2, 15, 30, 1);
        }, 'minute must be an integer or None');
        QUnit.assert.throws(function() {
            new Sao.PYSON.DateTime(2010, 1, 12, 10, 30, 'test', 0,
                -1, 12, -7, 2, 15, 30, 1);
        }, 'second must be an integer or None');
        QUnit.assert.throws(function() {
            new Sao.PYSON.DateTime(2010, 1, 12, 10, 30, 20, 'test',
                -1, 12, -7, 2, 15, 30, 1);
        }, 'microsecond must be an integer or None');
        QUnit.assert.throws(function() {
            new Sao.PYSON.DateTime(2010, 1, 12, 10, 30, 20, 0,
                'test', 12, -7, 2, 15, 30, 1);
        }, 'delta_years must be an integer or None');
        QUnit.assert.throws(function() {
            new Sao.PYSON.DateTime(2010, 1, 12, 10, 30, 20, 0,
                -1, 'test', -7, 2, 15, 30, 1);
        }, 'delta_months must be an integer or None');
        QUnit.assert.throws(function() {
            new Sao.PYSON.DateTime(2010, 1, 12, 10, 30, 20, 0,
                -1, 12, 'test', 2, 15, 30, 1);
        }, 'delta_days must be an integer or None');
        QUnit.assert.throws(function() {
            new Sao.PYSON.DateTime(2010, 1, 12, 10, 30, 20, 0,
                -1, 12, -7, 'test', 15, 30, 1);
        }, 'delta_hours must be an integer or None');
        QUnit.assert.throws(function() {
            new Sao.PYSON.DateTime(2010, 1, 12, 10, 30, 20, 0,
                -1, 12, -7, 2, 'test', 30, 1);
        }, 'delta_minutes must be an integer or None');
        QUnit.assert.throws(function() {
            new Sao.PYSON.DateTime(2010, 1, 12, 10, 30, 20, 0,
                -1, 12, -7, 2, 15, 'test', 1);
        }, 'delta_seconds must be an integer or None');
        QUnit.assert.throws(function() {
            new Sao.PYSON.DateTime(2010, 1, 12, 10, 30, 20, 0,
                -1, 12, -7, 2, 15, 30, 'test');
        }, 'delta_microseconds must be an integer or None');

        QUnit.assert.ok(Sao.common.compare(
                    new Sao.PYSON.DateTime(2010, 1, 12, 10, 30, 20, 0,
                        -1, 12, -7, 2, 15, 30, 1).types(),
                    ['object']), 'DateTime(2010, 1, 12, 10, 30, 20, 0, ' +
                        '-1, 12, -7, 2, 15, 30, 1).types()');

        var eval_;
        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.DateTime(2010, 1, 12, 10, 30, 20, 0));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_).valueOf(),
                new Date(Date.UTC(2010, 0, 12, 10, 30, 20, 0)).valueOf());

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.DateTime(2010, 1, 12, 10, 30, 20, 0, -1));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_).valueOf(),
                new Date(Date.UTC(2009, 0, 12, 10, 30, 20, 0)).valueOf());

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.DateTime(2010, 1, 12, 10, 30, 20, 0, 0, 12));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_).valueOf(),
                new Date(Date.UTC(2011, 0, 12, 10, 30, 20, 0)).valueOf());

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.DateTime(2010, 1, 12, 10, 30, 20, 0, 0, 0, -7));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_).valueOf(),
                new Date(Date.UTC(2010, 0, 5, 10, 30, 20, 0)).valueOf());

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.DateTime(2010, 1, 12, 10, 30, 20, 0,
                    0, 0, 0, 12));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_).valueOf(),
                new Date(Date.UTC(2010, 0, 12, 22, 30, 20, 0)).valueOf());

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.DateTime(2010, 1, 12, 10, 30, 20,
                    0, 0, 0, 0, 0, -30));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_).valueOf(),
                new Date(Date.UTC(2010, 0, 12, 10, 0, 20, 0)).valueOf());

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.DateTime(2010, 1, 12, 10, 30, 20,
                    0, 0, 0, 0, 0, 0, 30));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_).valueOf(),
                new Date(Date.UTC(2010, 0, 12, 10, 30, 50, 0)).valueOf());

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.DateTime(2010, 1, 12, 10, 30, 20,
                    0, 0, 0, 0, 0, 0, 0, 2000));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_).valueOf(),
                new Date(Date.UTC(2010, 0, 12, 10, 30, 20, 2)).valueOf());

        eval_ = new Sao.PYSON.Encoder().encode(
                new Sao.PYSON.DateTime(2010, 2, 22, 10, 30, 20, 2000));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_).valueOf(),
                new Date(Date.UTC(2010, 1, 22, 10, 30, 20, 2)).valueOf());

        QUnit.assert.strictEqual(new Sao.PYSON.DateTime(2010, 1, 12, 10, 30, 20, 0,
                -1, 12, -7, 2, 15, 30, 1).toString(),
            'DateTime(2010, 1, 12, 10, 30, 20, 0, -1, 12, -7, 2, 15, 30, 1, null)');
    });

    QUnit.test('PYSON DateTime start', function() {
        var eval_;

        eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.DateTime(
                undefined, undefined, undefined,
                undefined, undefined, undefined, undefined,
                undefined, undefined, undefined,
                undefined, undefined, undefined, undefined,
                new Sao.PYSON.Eval('datetime')));
        var datetime = Sao.DateTime(2000, 1, 1, 12, 0);

        QUnit.assert.strictEqual(new Sao.PYSON.Decoder(
            {'datetime': datetime}).decode(eval_).valueOf(),
            datetime.valueOf());

        eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.DateTime(
                undefined, undefined, undefined,
                undefined, undefined, undefined, undefined,
                undefined, undefined, undefined,
                undefined, undefined, undefined, undefined,
                new Sao.PYSON.Eval('date')));
        var date = Sao.DateTime(2000, 1, 1);

        QUnit.assert.strictEqual(new Sao.PYSON.Decoder(
            {'date': date}).decode(eval_).valueOf(),
            Sao.DateTime(2000, 1, 1, 0, 0).valueOf());

        eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.DateTime(
                undefined, undefined, undefined,
                undefined, undefined, undefined, undefined,
                undefined, undefined, undefined,
                undefined, undefined, undefined, undefined,
                new Sao.PYSON.Eval('foo')));

        QUnit.assert.ok(new Sao.PYSON.Decoder(
            {'foo': 'bar'}).decode(eval_).isDateTime);
    });

    QUnit.test('PYSON TimeDelta', function() {
        var value = new Sao.PYSON.TimeDelta(1, 2, 3).pyson();
        QUnit.assert.strictEqual(value.__class__, 'TimeDelta',
            'TimeDelta(1, 2, 3).pyson()');
        QUnit.assert.strictEqual(value.d, 1,
            'TimeDelta(1, 2, 3).pyson()');
        QUnit.assert.strictEqual(value.s, 2,
            'TimeDelta(1, 2, 3).pyson()');
        QUnit.assert.strictEqual(value.m, 3,
            'TimeDelta(1, 2, 3).pyson()');

        QUnit.assert.throws(function() {
            new Sao.PYSON.TimeDelta('test');
        }, 'days must be integer');

        QUnit.assert.ok(Sao.common.compare(
            new Sao.PYSON.TimeDelta(1, 2, 3).types(), ['object']),
            'TimeDelta(1, 2, 3).types()');

        var eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.TimeDelta(1, 2, 3));
        QUnit.assert.strictEqual(
            new Sao.PYSON.Decoder().decode(eval_).valueOf(),
            Sao.TimeDelta(1, 2, 3 / 1000).valueOf());

        QUnit.assert.strictEqual(
            new Sao.PYSON.TimeDelta(1, 2, 3).toString(),
            'TimeDelta(1, 2, 3)');
    });

    QUnit.test('PYSON Len', function() {
        var value = new Sao.PYSON.Len([1, 2, 3]).pyson();
        QUnit.assert.strictEqual(value.__class__, 'Len', 'Len([1, 2, 3]).pyson()');
        QUnit.assert.ok(Sao.common.compare(value.v, [1, 2, 3]),
            'Len([1, 2, 3]).pyson()');

        QUnit.assert.throws(function() {
            new Sao.PYSON.Len(1);
        }, 'Len(1)');

        QUnit.assert.ok(Sao.common.compare(new Sao.PYSON.Len([1, 2, 3]).types(),
                ['integer']), 'Len([1, 2, 3]).types()');

        var eval_;
        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Len([1, 2, 3]));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), 3,
            'decode(Len([1, 2, 3]))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Len({1: 2, 3: 4}));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), 2,
            'decode(Len({1: 2, 3: 4}))');

        eval_ = new Sao.PYSON.Encoder().encode(new Sao.PYSON.Len('foo bar'));
        QUnit.assert.strictEqual(new Sao.PYSON.Decoder().decode(eval_), 7,
            "decode(Len('foo bar'))");
        QUnit.assert.strictEqual(new Sao.PYSON.Len([1, 2, 3]).toString(),
            'Len([1, 2, 3])');
    });
    QUnit.test('PYSON Composite', function() {
        var expr = new Sao.PYSON.If(new Sao.PYSON.Not(
            new Sao.PYSON.In('company',
                new Sao.PYSON.Eval('context', {}))), '=', '!=');
        var eval_ = new Sao.PYSON.Encoder().encode(
            ['id', expr, new Sao.PYSON.Get(
                    new Sao.PYSON.Eval('context', {}), 'company', -1)]);
        QUnit.assert.ok(Sao.common.compare(
            new Sao.PYSON.Decoder({'context': {'company': 1}}).decode(eval_),
            ['id', '!=', 1]));
        QUnit.assert.ok(Sao.common.compare(
            new Sao.PYSON.Decoder({'context': {}}).decode(eval_),
            ['id', '=', -1]));

        QUnit.assert.strictEqual(expr.toString(),
            'If(Not(Eval("context", {}).contains("company")), "=", "!=")');
        });
    QUnit.test('PYSON noeval', function() {
        var decoder = new Sao.PYSON.Decoder({}, true);
        var encoder = new Sao.PYSON.Encoder();
        var noeval_tests = [
            new Sao.PYSON.Eval('test', 0),
            new Sao.PYSON.Not(true),
            new Sao.PYSON.Bool('test'),
            new Sao.PYSON.Not(true),
            new Sao.PYSON.Bool('test'),
            new Sao.PYSON.And(true, false, true),
            new Sao.PYSON.Or(false, true, true),
            new Sao.PYSON.Equal('foo', 'bar'),
            new Sao.PYSON.Greater(1, 0),
            new Sao.PYSON.Less(0, 1),
            new Sao.PYSON.If(true, 'foo', 'bar'),
            new Sao.PYSON.Get({'foo': 'bar'}, 'foo', 'default'),
            new Sao.PYSON.In('foo', ['foo', 'bar']),
            new Sao.PYSON.Date(),
            new Sao.PYSON.DateTime(),
            new Sao.PYSON.Len([1, 2, 3]),
        ];
        noeval_tests.forEach(function(instance) {
            QUnit.assert.ok(
                Sao.common.compare(decoder.decode(encoder.encode(instance)),
                    instance));
        });
    });

    QUnit.test('PYSON toString', function() {
        var value = {
            'test': ['foo', 'bar'],
            'pyson': new Sao.PYSON.Eval('test'),
        };
        QUnit.assert.strictEqual(Sao.PYSON.toString(value),
            '{"test": ["foo", "bar"], "pyson": Eval("test")}');
    });

    QUnit.test('PYSON.Eval dot notation', function() {
        var eval_;
        eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.Eval('foo.bar', 0));
        [[{'foo': {'bar': 1}}, 1],
            [{'foo': {'foo': 1}}, 0],
            [{'bar': {'bar': 1}}, 0],
        ].forEach(function(params){
            var ctx = params[0];
            var result = params[1];
            QUnit.assert.strictEqual(
                new Sao.PYSON.Decoder(ctx).decode(eval_), result,
                "decode(" + JSON.stringify(ctx) + ")");
        });
    });

    QUnit.test('PYSON.Eval dot notation nested', function() {
        var eval_;
        eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.Eval('foo.bar.test', 0));
        [[{'foo': {'bar': {'test': 1}}}, 1],
            [{'foo': {'foo': 1}}, 0],
            [{'bar': {'bar': 1}}, 0],
        ].forEach(function(params){
            var ctx = params[0];
            var result = params[1];
            QUnit.assert.strictEqual(
                new Sao.PYSON.Decoder(ctx).decode(eval_), result,
                "decode(" + JSON.stringify(ctx) + ")");
        });
    });

    QUnit.test('PYSON.EVal dot notation in context', function() {
        var eval_ = new Sao.PYSON.Encoder().encode(
            new Sao.PYSON.Eval('foo.bar', 0));
        var ctx = {
            'foo.bar': 1,
            'foo': {
                'bar': 0,
            },
        };
        QUnit.assert.strictEqual(
            new Sao.PYSON.Decoder(ctx).decode(eval_), 1,
            "decode(" + JSON.stringify(ctx) + ")");
    });

    QUnit.test('PYSON eval', function() {
        QUnit.assert.strictEqual(eval_pyson('True'), true, "eval_pyson('True')");
        QUnit.assert.strictEqual(eval_pyson('False'), false, "eval_pyson('False')");
        QUnit.assert.strictEqual(
            eval_pyson('And(True, True).toString()'),
            "And(true, true)", "eval_pyson('And(True, True)').toString()");
        QUnit.assert.strictEqual(
            eval_pyson('Or(True, False).toString()'),
            "Or(true, false)", "eval_pyson('Or(True, False)').toString()");
        QUnit.assert.strictEqual(
            eval_pyson('Eval("foo", {}).get("bar").toString()'),
            'Eval("foo", {}).get("bar")');
    });

    QUnit.test('PYSON eval default', function() {
        QUnit.assert.ok(
            Sao.common.compare(
                    new Sao.PYSON.Eval('date', new Sao.PYSON.Date()).types(),
                    ['object']),
            "Eval('date', Date()).types()");

        let expr = new Sao.PYSON.Equal(
            new Sao.PYSON.Eval('foo', new Sao.PYSON.Eval('bar', 1)),
            1);
        let encoded = new Sao.PYSON.Encoder().encode(expr);

        QUnit.assert.ok((new Sao.PYSON.Decoder()).decode(encoded));
        QUnit.assert.ok(!(new Sao.PYSON.Decoder({
            'foo': 2,
        })).decode(encoded));
        QUnit.assert.ok(!(new Sao.PYSON.Decoder({
            'bar': 2,
        })).decode(encoded));
        QUnit.assert.ok(new Sao.PYSON.Decoder({
            'foo': 1,
            'bar': 2,
        }).decode(encoded));
        QUnit.assert.strictEqual(expr.toString(), 'Equal(Eval("foo", Eval("bar", 1)), 1)')
    });

    var humanize_tests = [
        [0, '0'],
        [1, '1'],
        [5, '5'],
        [10, '10'],
        [50, '50'],
        [100, '100'],
        [1000, '1,000'],
        [1001, '1k'],
        [1500, '1.5k'],
        [1000000, '1,000k'],
        [1000001, '1M'],
        [1010000, '1.01M'],
        [Math.pow(10, 33), '1,000Q'],
        [0.1, '0.1'],
        [0.5, '0.5'],
        [0.01, '0.01'],
        [0.05, '0.05'],
        [0.001, '1m'],
        [0.0001, '0.1m'],
        [0.000001, '1µ'],
        [0.0000015, '1.5µ'],
        [0.00000105, '1.05µ'],
        [0.000001001, '1µ'],
        [Math.pow(10, -33), '0.001q'],
    ];

    QUnit.test('humanize', function() {
        humanize_tests.forEach(function(test) {
            var value = test[0];
            var text = test[1];
            QUnit.assert.equal(Sao.common.humanize(value), text,
                'humanize(' + JSON.stringify(value) + ')');
            if (value) {
                value *= -1;
                text = '-' + text;
                QUnit.assert.equal(Sao.common.humanize(value), text,
                    'humanize(' + JSON.stringify(value) + ')');
            }
        });
    });

    QUnit.test('DomainParser.group_operator', function() {
        var parser = new Sao.common.DomainParser();
        QUnit.assert.ok(Sao.common.compare(parser.group_operator(['a', '>', '=']),
                ['a', '>=']), "group_operator(['a', '>', '='])");
        QUnit.assert.ok(Sao.common.compare(parser.group_operator(['>', '=', 'b']),
                ['>=', 'b']), "group_operator(['>', '=', 'b'])");
        QUnit.assert.ok(Sao.common.compare(parser.group_operator(['a', '=', 'b']),
                ['a', '=', 'b']), "group_operator(['a', '=', 'b'])");
        QUnit.assert.ok(Sao.common.compare(parser.group_operator(['a', '>', '=', 'b']),
                ['a', '>=', 'b']), "group_operator(['a', '>', '=', 'b'])");
        QUnit.assert.ok(Sao.common.compare(parser.group_operator(['a', '>', '=', '=']),
                ['a', '>=', '=']), "group_operator(['a', '>', '=', '='])");
    });

    QUnit.test('DomainParser.parenthesize', function() {
        var parser = new Sao.common.DomainParser();
        [
        [['a'], ['a']],
        [['a', 'b'], ['a', 'b']],
        [['(', 'a', ')'], [['a']]],
        [['a', 'b', '(', 'c', '(', 'd', 'e', ')', 'f', ')', 'g'],
            ['a', 'b', ['c', ['d', 'e'], 'f'], 'g']],
        [['a', 'b', '(', 'c'], ['a', 'b', ['c']]],
        [['a', 'b', '(', 'c', '(', 'd', 'e', ')', 'f'],
            ['a', 'b', ['c', ['d', 'e'], 'f']]],
        [['a', 'b', ')'], ['a', 'b']],
        [['a', 'b', ')', 'c', ')', 'd)'], ['a', 'b']]
        ].forEach(function(test) {
            var value = test[0];
            var result = test[1];
            QUnit.assert.ok(Sao.common.compare(parser.parenthesize(value), result),
                'parenthesize(' + JSON.stringify(value) + ')');
        });
    });

    var timedelta_tests = [
        [null, ''],
        [Sao.TimeDelta(3, 0, 0, 30, 5), '3d 05:30'],
        [Sao.TimeDelta(0, 0, 0, 0, 0, 48), '11M 6d'],
        [Sao.TimeDelta(0, 0, 0, 0, 0, 50), '11M 2w 6d'],
        [Sao.TimeDelta(0, 0, 0, 0, 0, 52), '12M 4d'],
        [Sao.TimeDelta(360), '12M'],
        [Sao.TimeDelta(364), '12M 4d'],
        [Sao.TimeDelta(365), '1Y'],
        [Sao.TimeDelta(366), '1Y 1d'],
        [Sao.TimeDelta(0, 10, 0, 5, 2), '02:05:10'],
        [Sao.TimeDelta(0, 0, 42, 15), '00:15:00.042000'],
        [Sao.TimeDelta(1, 0, 42), '1d .042000'],
        [Sao.TimeDelta(0, -1), '-00:00:01'],
        [Sao.TimeDelta(-1, 0, 0, -30, -5), '-1d 05:30']
        ];

    QUnit.test('timedelta.format', function() {
        timedelta_tests.forEach(function(test) {
            var timedelta = test[0];
            var text = test[1];
            QUnit.assert.equal(Sao.common.timedelta.format(timedelta), text,
                'timedelta.format(' + JSON.stringify(timedelta) + ')');
        });
    });
    var time_only_converter_values = [
        [null, ''],
        [Sao.TimeDelta(5, 0, 0, 30, 5), '125:30'],
        [Sao.TimeDelta(0, 10, 0, 5, 2), '02:05:10'],
        [Sao.TimeDelta(0, 0, 42, 15), '00:15:00.042000'],
        [Sao.TimeDelta(1, 0, 42), '24:00:00.042000'],
        [Sao.TimeDelta(0, -1), '-00:00:01'],
        [Sao.TimeDelta(-1, 0, 0, -30, -5), '-29:30']
        ];

    var converter_time_only =  {};
    converter_time_only.s = Sao.common.timedelta.DEFAULT_CONVERTER.s;
    converter_time_only.m = Sao.common.timedelta.DEFAULT_CONVERTER.m;
    converter_time_only.h = Sao.common.timedelta.DEFAULT_CONVERTER.h;
    converter_time_only.d = 0;

    QUnit.test('timedelta.format time only converter', function() {
        time_only_converter_values.forEach(function(test) {
            var timedelta = test[0];
            var text = test[1];
            QUnit.assert.equal(Sao.common.timedelta.format(
                timedelta, converter_time_only), text,
                'timedelta.format(' + JSON.stringify(timedelta) + ')');
        });
    });

    var timedelta_tests_parse = [
        [Sao.TimeDelta(), '  '],
        [Sao.TimeDelta(), 'foo'],
        [Sao.TimeDelta(1.5), '1.5d'],
        [Sao.TimeDelta(-2), '1d -1d'],
        [Sao.TimeDelta(0, 10, 0, 5, 1), '1:5:10:42'],
        [Sao.TimeDelta(0, 0, 0, 0, 2), '1: 1:'],
        [Sao.TimeDelta(0, 0, 0, 0, 0.25), ':15'],
        [Sao.TimeDelta(0, 0, 0, 0, 1), '1h'],
        [Sao.TimeDelta(0, 0, 0, 0, 0.25), '.25h'],
    ];

    QUnit.test('timedelta.parse', function() {
        function asSeconds(timedelta) {
            if (timedelta) {
                return timedelta.asSeconds();
            } else {
                return timedelta;
            }
        }
        timedelta_tests.concat(timedelta_tests_parse).forEach(function(test) {
            var timedelta = test[0];
            var text = test[1];
            QUnit.assert.equal(asSeconds(Sao.common.timedelta.parse(text)),
                asSeconds(timedelta),
                'timedelta.parse(' + JSON.stringify(timedelta) + ')');
        });
    });

    QUnit.test('timedelta.parse time only converter', function() {
        function asSeconds(timedelta) {
            if (timedelta) {
                return timedelta.asSeconds();
            } else {
                return timedelta;
            }
        }
        time_only_converter_values.forEach(function(test) {
            var timedelta = test[0];
            var text = test[1];
            QUnit.assert.equal(asSeconds(Sao.common.timedelta.parse(text)),
                asSeconds(timedelta),
                'timedelta.parse(' + JSON.stringify(timedelta) + ')');
        });
    });

    QUnit.test('DomainParser.group', function() {
        var parser = new Sao.common.DomainParser({
            'name': {
                'string': 'Name'
            },
            'firstname': {
                'string': 'First Name'
            },
            'surname': {
                'string': '(Sur)Name'
            },
            'relation': {
                'string': "Relation",
                'relation': 'relation',
                'relation_fields': {
                    'name': {
                        'string': "Name",
                    },
                },
            },
        });
        var udlex = function(input) {
            var lex = new Sao.common.udlex(input);
            var tokens = [];
            do {
                var token = lex.next();
                if (token !== null) {
                    tokens.push(token);
                }
            } while (token !== null);
            return tokens;
        };
        var c = function(clause) {
            clause.clause = true;
            return clause;
        };
        [
        ['Name: Doe', [c(['Name', null, 'Doe'])]],
        ['"(Sur)Name": Doe', [c(['(Sur)Name', null, 'Doe'])]],
        ['Name: Doe Name: John', [
            c(['Name', null, 'Doe']),
            c(['Name', null, 'John'])
            ]],
        ['Name: Name: John', [
            c(['Name', null, null]),
            c(['Name', null, 'John'])
            ]],
        ['First Name: John', [c(['First Name', null, 'John'])]],
        ['Name: Doe First Name: John', [
            c(['Name', null, 'Doe']),
            c(['First Name', null, 'John'])
            ]],
        ['First Name: John Name: Doe', [
            c(['First Name', null, 'John']),
            c(['Name', null, 'Doe'])
            ]],
        ['First Name: John First Name: Jane', [
            c(['First Name', null, 'John']),
            c(['First Name', null, 'Jane'])
            ]],
        ['Name: John Doe', [
            c(['Name', null, 'John']),
            c(['Doe'])
            ]],
        ['Name: "John Doe"', [c(['Name', null, 'John Doe'])]],
        ['Doe Name: John', [c(['Doe']), c(['Name', null, 'John'])]],
        ['Name: =Doe', [['Name', '=', 'Doe']]],
        ['Name: =Doe Name: >John', [
            c(['Name', '=', 'Doe']),
            c(['Name', '>', 'John'])
            ]],
        ['First Name: =John First Name: =Jane', [
            c(['First Name', '=', 'John']),
            c(['First Name', '=', 'Jane'])
            ]],
        ['Name: John;Jane', [c(['Name', null, ['John', 'Jane']])]],
        ['Name: John;', [c(['Name', null, ['John']])]],
        ['Name: John;Jane Name: Doe', [
            c(['Name', null, ['John', 'Jane']]),
            c(['Name', null, 'Doe'])
            ]],
        ['Name: John; Name: Doe', [
            c(['Name', null, ['John']]),
            c(['Name', null, 'Doe'])
            ]],
        ['Name:', [c(['Name', null, null])]],
        ['Name: =', [c(['Name', '=', null])]],
        ['Name: =""', [c(['Name', '=', ''])]],
        ['Name: = ""', [c(['Name', '=', ''])]],
        ['Name: = Name: Doe', [
            c(['Name', '=', null]),
            c(['Name', null, 'Doe'])
            ]],
        ['Name: \\"foo\\"', [
            c(['Name', null, '"foo"'])
            ]],
        ['Name: "" <', [
            c(['Name', '', '<'])
            ]],
        ['Relation.Name: Test', [
            c(['Relation.Name', null, 'Test']),
        ]],
        ].forEach(function(test) {
            var value = test[0];
            var result = test[1];
            var parsed = parser.group(udlex(value));
            QUnit.assert.deepEqual(parsed, result,
                'group(udlex(' + JSON.stringify(value) + ')');
            parsed.forEach(function(clause) {
                QUnit.assert.ok(clause.clause, JSON.stringify(clause));
            });
        });
    });

    QUnit.test('DomainParser.operatorize', function() {
        var parser = new Sao.common.DomainParser();
        var a = ['a', 'a', 'a'];
        a.clause = true;
        var b = ['b', 'b', 'b'];
        b.clause = true;
        var c = ['c', 'c', 'c'];
        c.clause = true;
        var null_ = ['d', null, 'x'];
        null_.clause = true;
        var double_null_ = ['e', null, null];
        double_null_.clause = true;

        [
        [['a'], ['a']],
        [['a', '|', 'b'], [['OR', 'a', 'b']]],
        [['a', '|', 'b', '|', 'c'], [['OR', ['OR', 'a', 'b'], 'c']]],
        [['a', 'b', '|', 'c'], ['a', ['OR', 'b', 'c']]],
        [['a', '|', 'b', 'c'], [['OR', 'a', 'b'], 'c']],
        [['a', ['b', 'c']], ['a', ['b', 'c']]],
        [['a', ['b', 'c'], 'd'], ['a', ['b', 'c'], 'd']],
        [['a', '|', ['b', 'c']], [['OR', 'a', ['b', 'c']]]],
        [['a', '|', ['b', 'c'], 'd'],
            [['OR', 'a', ['b', 'c']], 'd']],
        [['a', ['b', 'c'], '|', 'd'],
            ['a', ['OR', ['b', 'c'], 'd']]],
        [['a', '|', ['b', '|', 'c']],
            [['OR', 'a', [['OR', 'b', 'c']]]]],
        [['|'], []],
        [['|', 'a'], ['a']],
        [['a', ['|', 'b']], ['a', ['b']]],
        [['a', '|', '|', 'b'], [['OR', 'a', 'b']]],
        [['|', '|', 'a'], ['a']],
        [['|', '|', 'a', 'b'], ['a', 'b']],
        [['|', '|', 'a', '|', 'b'], [['OR', 'a', 'b']]],
        [['a', ['b', '|', 'c']], ['a', [['OR', 'b', 'c']]]],
        [[a, [b, ['|'], c]], [a, [['OR', b, c]]]],
        [['a', ['b', '|']], ['a', [['OR', 'b']]]],
        [[null_], [null_]],
        [[null_, '|', double_null_], [['OR', null_, double_null_]]]
        ].forEach(function(test) {
            var value = test[0];
            var result = test[1];
            QUnit.assert.deepEqual(parser.operatorize(value), result,
                'operatorize(' + JSON.stringify(value) + ')');
        });
    });

    QUnit.test('DomainParser.likify', function() {
        var parser = new Sao.common.DomainParser();

        [
            ['', '%'],
            ['foo', '%foo%'],
            ['foo%', 'foo%'],
            ['foo_bar', 'foo_bar'],
            ['foo\\%', '%foo\\%%'],
            ['foo\\_bar', '%foo\\_bar%'],
        ].forEach(function(test) {
            var value = test[0];
            var result = test[1];
            QUnit.assert.ok(Sao.common.compare(parser.likify(value), result),
                'likify(' + JSON.stringify(value) + ')');
        });
    });

    QUnit.test('DomainParser.quote', function() {
        var parser = new Sao.common.DomainParser();

        [
        ['test', 'test'],
        ['foo bar', '"foo bar"'],
        ['"foo"', '\\"foo\\"'],
        ['foo\\bar', 'foo\\\\bar']
        ].forEach(function(test) {
            var value = test[0];
            var result = test[1];
            QUnit.assert.ok(Sao.common.compare(parser.quote(value), result),
                'quote(' + JSON.stringify(value) + ')');
        });
    });

    QUnit.test('DomainParser.split_target_value', function() {
        var parser = new Sao.common.DomainParser();

        var field = {
            'type': 'reference',
            'selection': [
                ['spam', 'Spam'],
                ['ham', 'Ham'],
                ['e', 'Eggs']
            ]
        };

        var test_func = function(test) {
            var value = test[0];
            var result = test[1];
            QUnit.assert.ok(Sao.common.compare(
                    parser.split_target_value(this, value), result),
                'split_target_value(' + JSON.stringify(this) + ', ' +
                    JSON.stringify(value) + ')');
        };

        [
        ['Spam', [null, 'Spam']],
        ['foo', [null, 'foo']],
        ['Spam,', ['spam', '']],
        ['Ham,bar', ['ham', 'bar']],
        ['Eggs,foo', ['e', 'foo']]
        ].forEach(test_func, field);
    });

    QUnit.test('DomainParser.convert_value', function() {
        var parser = new Sao.common.DomainParser();
        var context = {
            'date_format': '%Y-%m-%d',
        };

        var test_func = function(test) {
            var value = test[0];
            var result = test[1];
            QUnit.assert.strictEqual(
                parser.convert_value(this, value, context), result,
                'convert_value(' + JSON.stringify(this) + ', ' +
                JSON.stringify(value) + ', ' + JSON.stringify(context) + ')');
        };

        var test_valueOf_func = function(test) {
            var value = test[0];
            var result = test[1];
            QUnit.assert.strictEqual(
                parser.convert_value(this, value, context).valueOf(),
                result.valueOf(),
                'convert_value(' + JSON.stringify(this) + ', ' +
                JSON.stringify(value) + ', ' + JSON.stringify(context) + ')');
        };

        var field = {
            'type': 'boolean'
        };
        [
        ['Y', true],
        ['yes', true],
        ['t', true],
        ['1', true],
        ['N', false],
        ['False', false],
        ['no', false],
        ['0', false],
        [null, null],
        ].forEach(test_func, field);

        field = {
            'type': 'float'
        };
        [
        ['1', 1.0],
        ['1.5', 1.5],
        ['', null],
        ['test', null],
        [null, null]
        ].forEach(test_func, field);

        test_func.call({'type': 'float', 'factor': '100'}, ['42', 0.42]);

        field = {
            'type': 'integer'
        };
        [
        ['1', 1],
        ['1.5', 1],
        ['', null],
        ['test', null],
        [null, null]
        ].forEach(test_func, field);

        test_func.call({'type': 'integer', 'factor': '2'}, ['6', 3]);

        var test_func_numeric = function(test) {
            var value = test[0];
            var result = test[1];
            value = parser.convert_value(this, value);
            if (value !== null) {
                value = value.toString();
            }
            if (result !== null) {
                result = result.toString();
            }
            QUnit.assert.strictEqual(value, result,
                'convert_value(' + JSON.stringify(this) + ', ' +
                    JSON.stringify(test[0]) + ')');
        };

        field = {
            'type': 'numeric'
        };
        [
        ['1', new Sao.Decimal(1)],
        ['1.5', new Sao.Decimal('1.5')],
        ['', null],
        ['test', null],
        [null, null]
        ].forEach(test_func_numeric, field);

        test_func_numeric.call(
            {'type': 'numeric', 'factor': '5'},
            ['1', new Sao.Decimal('0.2')]);

        field = {
            'type': 'selection',
            'selection': [
                ['male', 'Male'],
                ['female', 'Female']
            ]
        };
        var field_with_empty = jQuery.extend({}, field);
        field_with_empty.selection = jQuery.extend(
                [['', '']], field_with_empty.selection);
        var tests = [
        ['Male', 'male'],
        ['male', 'male'],
        ['test', 'test'],
        [null, null],
        ['', '']
        ];
        tests.forEach(test_func, field);
        tests.forEach(test_func, field_with_empty);

        field = {
            'type': 'datetime',
            'format': '"%H:%M:%S"'
        };
        [
        ['2002-12-04', Sao.DateTime(2002, 11, 4)],
        ['2002-12-04 12:30:00', Sao.DateTime(2002, 11, 4, 12, 30)]
        ].forEach(test_valueOf_func, field);
        [
        ['test', null],
        [null, null]
        ].forEach(test_func, field);

        field = {
            'type': 'date'
        };
        [
        ['2002-12-04', Sao.Date(2002, 11, 4)]
        ].forEach(test_valueOf_func, field);
        [
        ['test', null],
        [null, null]
        ].forEach(test_func, field);

        field = {
            'type': 'time',
            'format': '"%H:%M:%S"'
        };
        [
        ['12:30:00', Sao.Time(12, 30, 0)],
        ].forEach(test_valueOf_func, field);
        [
        ['test', null],
        [null, null]
        ].forEach(test_func, field);

        field = {
            'type': 'timedelta'
        };
        [
        ['1d 2:00', Sao.TimeDelta(1, 2 * 60 * 60)],
        ['foo', Sao.TimeDelta()],
        ].forEach(test_valueOf_func, field);
        [
        [null, null]
        ].forEach(test_func, field);
    });

    QUnit.test('DomainParser.parse_clause', function() {
        var parser = new Sao.common.DomainParser({
            'name': {
                'string': 'Name',
                'name': 'name',
                'type': 'char'
            },
            'integer': {
                'string': 'Integer',
                'name': 'integer',
                'type': 'integer'
            },
            'selection': {
                'string': 'Selection',
                'name': 'selection',
                'type': 'selection',
                'selection': [
                    ['male', 'Male'],
                    ['female', 'Female']
                ]
            },
            'multiselection': {
                'string': "MultiSelection",
                'type': 'multiselection',
                'selection': [
                    ['foo', "Foo"],
                    ['bar', "Bar"],
                    ['baz', "Baz"],
                ],
            },
            'reference': {
                'string': 'Reference',
                'name': 'reference',
                'type': 'reference',
                'selection': [
                    ['spam', 'Spam'],
                    ['ham', 'Ham']
                ]
            },
            'many2one': {
                'string': "Many2One",
                'name': 'many2one',
                'type': 'many2one',
            },
            'relation': {
                'string': "Relation",
                'name': 'relation',
                'type': 'many2one',
                'relation_fields': {
                    'name': {
                        'string': "Name",
                        'name': 'name',
                        'type': 'char',
                    },
                    'm2o': {
                        'string': "M2O",
                        'name': 'm2o',
                        'type': 'many2one',
                        'relation_fields': {
                            'foo': {
                                'string': "Foo",
                                'name': 'foo',
                                'type': 'integer',
                            },
                        },
                    },
                },
            },
        });
        var c = function(value) {
            value.clause = true;
            return value;
        };
        [
        [[c(['John'])], [['rec_name', 'ilike', '%John%']]],
        [[c(['Name', null, null])], [['name', 'ilike', '%']]],
        [[c(['Name', '', null])], [['name', 'ilike', '%']]],
        [[c(['Name', '=', null])], [['name', '=', null]]],
        [[c(['Name', '=', ''])], [['name', '=', '']]],
        [[c(['Name', null, 'Doe'])], [['name', 'ilike', '%Doe%']]],
        [[c(['Name', '!', 'Doe'])], [c(['name', 'not ilike', '%Doe%'])]],
        [[c(['Name', null, ['John', 'Jane']])],
            [c(['name', 'in', ['John', 'Jane']])]],
        [[c(['Name', '!', ['John', 'Jane']])],
            [c(['name', 'not in', ['John', 'Jane']])]],
        [[c(['Selection', null, null])], [c(['selection', '=', null])]],
        [[c(['Selection', null, ''])], [c(['selection', '=', ''])]],
        [[c(['Selection', null, ['Male', 'Female']])],
            [c(['selection', 'in', ['male', 'female']])]],
        [[c(['MultiSelection', null, null])],
            [c(['multiselection', '=', null])]],
        [[c(['MultiSelection', null, ''])],
            [c(['multiselection', 'in', ['']])]],
        [[c(['MultiSelection', '=', ''])],
            [c(['multiselection', '=', ['']])]],
        [[c(['MultiSelection', '!', ''])],
            [c(['multiselection', 'not in', ['']])]],
        [[c(['MultiSelection', '!=', ''])],
            [c(['multiselection', '!=', ['']])]],
        [[c(['MultiSelection', null, ['Foo', 'Bar']])],
            [c(['multiselection', 'in', ['foo', 'bar']])]],
        [[c(['MultiSelection', '=', ['Foo', 'Bar']])],
            [c(['multiselection', '=', ['foo', 'bar']])]],
        [[c(['MultiSelection', '!', ['Foo', 'Bar']])],
            [c(['multiselection', 'not in', ['foo', 'bar']])]],
        [[c(['MultiSelection', '!=', ['Foo', 'Bar']])],
            [c(['multiselection', '!=', ['foo', 'bar']])]],
        [[c(['Integer', null, null])], [c(['integer', '=', null])]],
        [[c(['Integer', null, '3..5'])], [[
            c(['integer', '>=', 3]),
            c(['integer', '<=', 5])
            ]]],
        [[c(['Reference', null, 'foo'])],
            [c(['reference', 'ilike', '%foo%'])]],
        [[c(['Reference', null, 'Spam'])],
            [c(['reference', 'ilike', '%spam%'])]],
        [[c(['Reference', null, 'Spam,bar'])], [
            c(['reference.rec_name', 'ilike', '%bar%', 'spam'])
            ]],
        [[c(['Reference', null, ['foo', 'bar']])], [
            c(['reference', 'in', ['foo', 'bar']])
            ]],
        [['OR', c(['Name', null, 'John']), c(['Name', null, 'Jane'])],
            ['OR', c(['name', 'ilike', '%John%']),
                c(['name', 'ilike', '%Jane%'])
            ]],
        [[c(['Many2One', null, 'John'])],
            [['many2one.rec_name', 'ilike', '%John%']]],
        [[c(['Many2One', null, ['John', 'Jane']])],
            [['many2one.rec_name', 'in', ['John', 'Jane']]]],
        [[[c(['John'])]], [[['rec_name', 'ilike', '%John%']]]],
        [[c(['Relation', null, 'John'])],
            [['relation.rec_name', 'ilike', '%John%']]],
        [[c(['Relation.Name', null, "Test"])],
            [['relation.name', 'ilike', "%Test%"]]],
        [[c(['Relation.M2O', null, "Foo"])],
            [['relation.m2o.rec_name', 'ilike', "%Foo%"]]],
        [[c(['Relation.M2O.Foo', null, "42"])],
            [['relation.m2o.foo', '=', 42]]],
        [[c(['OR'])], [['rec_name', 'ilike', "%OR%"]]],
        [[c(['AND'])], [['rec_name', 'ilike', "%AND%"]]],
        ].forEach(function(test) {
            var value = test[0];
            var result = test[1];
            QUnit.assert.deepEqual(parser.parse_clause(value), result,
                'parse_clause(' + JSON.stringify(value) + ')');
        });
    });

    QUnit.test('DomainParser.format_value', function() {
        var parser = new Sao.common.DomainParser();
        var context = {
            'date_format': '%Y-%m-%d',
        };

        var test_func = function(test) {
            var value = test[0];
            var result = test[1];
            QUnit.assert.strictEqual(
                parser.format_value(this, value, null, context), result,
                'format_value(' + JSON.stringify(this) + ', ' +
                JSON.stringify(value) + ', null, ' + JSON.stringify(context) +
                ')');
        };

        var field = {
            'type': 'boolean'
        };
        [
        [true, 'True'],
        [false, 'False'],
        [null, '']
        ].forEach(test_func, field);

        field = {
            'type': 'integer'
        };
        [
        [1, '1'],
        [1.5, '1'],
        [0, '0'],
        [0.0, '0'],
        [false, ''],
        [null, '']
        ].forEach(test_func, field);

        test_func.call({'type': 'integer', 'factor': '2'}, [3, '6']);

        field = {
            'type': 'float'
        };
        [
        [1, '1'],
        [1.5, '1.5'],
        [1.50, '1.5'],
        [150.79, '150.79'],
        [0, '0'],
        [0.0, '0'],
        [false, ''],
        [null, ''],
        [1e-12, '0.000000000001'],
        [1.0579e-10, '0.00000000010579'],
        ].forEach(test_func, field);

        test_func.call({'type': 'float', 'factor': '100'}, [0.42, '42']);

        field = {
            'type': 'numeric'
        };
        [
        [new Sao.Decimal(1), '1'],
        [new Sao.Decimal('1.5'), '1.5'],
        [new Sao.Decimal('1.50'), '1.5'],
        [new Sao.Decimal('150.79'), '150.79'],
        [new Sao.Decimal(0), '0'],
        [new Sao.Decimal('0.0'), '0'],
        [false, ''],
        [null, '']
        ].forEach(test_func, field);

        test_func.call(
            {'type': 'numeric', 'factor': '5'},
            [new Sao.Decimal('0.2'), '1']);

        field = {
            'type': 'selection',
            'selection': [
                ['male', 'Male'],
                ['female', 'Female']
                ]
        };
        [
        ['male', 'Male'],
        ['test', 'test'],
        [false, ''],
        [null, '']
        ].forEach(test_func, field);

        field = {
            'type': 'datetime',
            'format': '"%H:%M:%S"'
        };
        var field_with_empty = jQuery.extend({}, field);
        field_with_empty.selection = jQuery.extend(
                [['', '']], field_with_empty.selection);
        var tests = [
        [Sao.Date(2002, 11, 4), '2002-12-04'],
        [Sao.DateTime(2002, 11, 4), '2002-12-04'],
        [Sao.DateTime(2002, 11, 4, 12, 30), '"2002-12-04 12:30:00"'],
        [false, ''],
        [null, '']
        ];
        tests.forEach(test_func, field);
        tests.forEach(test_func, field_with_empty);

        field = {
            'type': 'date'
        };
        [
        [Sao.Date(2002, 11, 4), '2002-12-04'],
        [false, ''],
        [null, '']
        ].forEach(test_func, field);

        field = {
            'type': 'time',
            'format': '"%H:%M:%S"'
        };
        [
        [Sao.Time(12, 30, 0), '"12:30:00"'],
        [false, ''],
        [null, '']
        ].forEach(test_func, field);

        field = {
            'type': 'timedelta'
        };
        [
        [Sao.TimeDelta(1, 2 * 60 * 60), '"1d 02:00"'],
        [Sao.TimeDelta(), ''],
        ['', '']
        ].forEach(test_func, field);
    });

    QUnit.test('DomainParser.stringable', function() {
        var parser = new Sao.common.DomainParser({
            'name': {
                'string': 'Name',
                'type': 'char',
            },
            'multiselection': {
                'string': "MultiSelection",
                'type': 'multiselection',
                'selection': [
                    ['foo', "Foo"],
                    ['bar', "Bar"],
                    ['baz', "Baz"],
                ],
            },
            'relation': {
                'string': 'Relation',
                'type': 'many2one',
                'relation_fields': {
                    'name': {
                        'string': "Name",
                        'type': 'char',
                    },
                },
            },
            'relations': {
                'string': 'Relations',
                'type': 'many2many',
            },
        });
        var valid = ['name', '=', 'Doe'];
        var invalid = ['surname', '=', 'John'];
        QUnit.assert.ok(parser.stringable([]));
        QUnit.assert.ok(parser.stringable([[]]));
        QUnit.assert.ok(parser.stringable([valid]));
        QUnit.assert.ok(!parser.stringable([invalid]));
        QUnit.assert.ok(parser.stringable(['AND', valid]));
        QUnit.assert.ok(!parser.stringable(['AND', valid, invalid]));
        QUnit.assert.ok(parser.stringable([[valid]]));
        QUnit.assert.ok(!parser.stringable([[valid], [invalid]]));
        QUnit.assert.ok(parser.stringable([['multiselection', '=', null]]));
        QUnit.assert.ok(parser.stringable([['multiselection', '=', '']]));
        QUnit.assert.ok(!parser.stringable([['multiselection', '=', 'foo']]));
        QUnit.assert.ok(parser.stringable([['multiselection', '=', ['foo']]]));
        QUnit.assert.ok(parser.stringable([['relation', '=', null]]));
        QUnit.assert.ok(parser.stringable([['relation', '=', 'Foo']]));
        QUnit.assert.ok(parser.stringable([['relation.rec_name', '=', 'Foo']]));
        QUnit.assert.ok(!parser.stringable([['relation', '=', 1]]));
        QUnit.assert.ok(parser.stringable([['relations', '=', 'Foo']]));
        QUnit.assert.ok(parser.stringable([['relations', '=', null]]));
        QUnit.assert.ok(parser.stringable([['relations', 'in', ['Foo']]]));
        QUnit.assert.ok(!parser.stringable([['relations', 'in', [42]]]));
        QUnit.assert.ok(parser.stringable([['relation.name', '=', "Foo"]]));
    });

    QUnit.test('DomainParser.string', function() {
        var parser = new Sao.common.DomainParser({
            'name': {
                'string': 'Name',
                'type': 'char'
            },
            'surname': {
                'string': '(Sur)Name',
                'type': 'char'
            },
            'date': {
                'string': 'Date',
                'type': 'date'
            },
            'selection': {
                'string': 'Selection',
                'type': 'selection',
                'selection': [
                    ['male', 'Male'],
                    ['femal', 'Femal']
                ]
            },
            'multiselection': {
                'string': "MultiSelection",
                'type': 'multiselection',
                'selection': [
                    ['foo', "Foo"],
                    ['bar', "Bar"],
                    ['baz', "Baz"],
                ],
            },
            'reference': {
                'string': 'Reference',
                'type': 'reference',
                'selection': [
                    ['spam', 'Spam'],
                    ['ham', 'Ham']
                ]
            },
            'many2one': {
                'string': "Many2One",
                'name': 'many2one',
                'type': 'many2one',
                'relation_fields': {
                    'name': {
                        'string': "Name",
                        'type': 'char',
                    },
                },
            },
        });

        [
        [[['name', '=', 'Doe']], 'Name: =Doe'],
        [[['name', '=', null]], 'Name: ='],
        [[['name', '=', '']], 'Name: =""'],
        [[['name', 'ilike', '%']], 'Name: '],
        [[['name', 'ilike', '%Doe%']], 'Name: Doe'],
        [[['name', 'ilike', '%<%']], 'Name: "" "<"'],
        [[['name', 'ilike', 'Doe']], 'Name: =Doe'],
        [[['name', 'ilike', 'Doe%']], 'Name: Doe%'],
        [[['name', 'ilike', 'Doe\\%']], 'Name: =Doe%'],
        [[['name', 'not ilike', '%Doe%']], 'Name: !Doe'],
        [[['name', 'in', ['John', 'Jane']]], 'Name: John;Jane'],
        [[['name', 'in', ['John', '']]], 'Name: John;""'],
        [[['name', 'in', ['John']]], 'Name: =John'],
        [[['name', 'not in', ['John', 'Jane']]], 'Name: !John;Jane'],
        [[['name', 'not in', ['John']]], 'Name: !=John'],
        [[
            ['name', 'ilike', '%Doe%'],
            ['name', 'ilike', '%Jane%']
            ], 'Name: Doe Name: Jane'],
        [['AND',
            ['name', 'ilike', '%Doe%'],
            ['name', 'ilike', '%Jane%']
            ], 'Name: Doe Name: Jane'],
        [['OR',
            ['name', 'ilike', '%Doe%'],
            ['name', 'ilike', '%Jane%']
            ], 'Name: Doe | Name: Jane'],
        [[
            ['name', 'ilike', '%Doe%'],
            ['OR',
                ['name', 'ilike', '%John%'],
                ['name', 'ilike', '%Jane%']
                ]
            ], 'Name: Doe (Name: John | Name: Jane)'],
        [[], ''],
        [[['surname', 'ilike', '%Doe%']], '"(Sur)Name": Doe'],
        //[[['date', '>=', new Date(2012, 10, 24)]], 'Date: >=10/24/2012'],
        [[['selection', '=', '']], 'Selection: '],
        [[['selection', '=', null]], 'Selection: '],
        [[['selection', '!=', '']], 'Selection: !""'],
        [[['selection', '=', 'male']], 'Selection: Male'],
        [[['selection', '!=', 'male']], 'Selection: !Male'],
        [[['multiselection', '=', null]], "MultiSelection: ="],
        [[['multiselection', '=', '']], "MultiSelection: ="],
        [[['multiselection', '!=', '']], "MultiSelection: !="],
        [[['multiselection', '=', ['foo']]], "MultiSelection: =Foo"],
        [[['multiselection', '!=', ['foo']]], "MultiSelection: !=Foo"],
        [[['multiselection', '=', ['foo', 'bar']]], "MultiSelection: =Foo;Bar"],
        [[['multiselection', '!=', ['foo', 'bar']]], "MultiSelection: !=Foo;Bar"],
        [[['multiselection', 'in', ['foo']]], "MultiSelection: Foo"],
        [[['multiselection', 'not in', ['foo']]], "MultiSelection: !Foo"],
        [[['multiselection', 'in', ['foo', 'bar']]], "MultiSelection: Foo;Bar"],
        [[['multiselection', 'not in', ['foo', 'bar']]], "MultiSelection: !Foo;Bar"],
        [[['reference', 'ilike', '%foo%']], 'Reference: foo'],
        [[['reference', 'ilike', '%bar%', 'spam']], 'Reference: Spam,bar'],
        [[['reference', 'in', ['foo', 'bar']]], 'Reference: foo;bar'],
        [[['many2one', 'ilike', '%John%']], 'Many2One: John'],
        [[['many2one.rec_name', 'in', ['John', 'Jane']]], 'Many2One: John;Jane'],
        [[['many2one.name', 'ilike', '%Foo%']], 'Many2One.Name: Foo'],
        ].forEach(function(test) {
            var value = test[0];
            var result = test[1];
            QUnit.assert.strictEqual(parser.string(value), result,
                'string(' + JSON.stringify(value) + ')');
        });
    });

    QUnit.test('DomainParser.complete_value', function () {
        var parser = new Sao.common.DomainParser();
        var field;

        var test_func = function(test) {
            var value = test[0];
            var result = test[1];
            QUnit.assert.deepEqual(parser.complete_value(this, value), result,
                    'complete_value(' + JSON.stringify(this) +
                        ', ' + JSON.stringify(value) + ')');
        };

        field = {
            'type': 'boolean',
        };
        [
            [null, [true, false]],
            [true, [false]],
            [false, [true]],
        ].forEach(test_func, field);

        field = {
            'type': 'selection',
            'selection': [
                ['male', 'Male'],
                ['female', 'Female'],
                ],
        };
        [
            ['m', ['male']],
            ['test', []],
            ['', ['male', 'female']],
            [null, ['male', 'female']],
            [['male', 'f'], [['male', 'female']]],
            [['male', null], [['male', 'male'], ['male', 'female']]],
        ].forEach(test_func, field);

        field = {
            'type': 'selection',
            'selection': [
                ['male', 'Male'],
                ['female', 'Female'],
                ['', ''],
                ],
        };
        [
            ['m', ['male']],
            ['test', []],
            ['', ['male', 'female', '']],
            [null, ['male', 'female', '']],
            [['male', 'f'], [['male', 'female']]],
        ].forEach(test_func, field);

        field = {
            'type': 'reference',
            'selection': [
                ['spam', 'Spam'],
                ['ham', 'Ham'],
                ['', ''],
            ]
        };
        [
            ['s', ['%spam%']],
            ['test', []],
            ['', ['%spam%', '%ham%', '%']],
            [null, ['%spam%', '%ham%', '%']],
            [['spam', 'h'], [['spam', 'ham']]],
        ].forEach(test_func, field);

    });

    QUnit.test('DomainInversion simple_inversion', function() {
        var domain_inversion = new Sao.common.DomainInversion();
        domain_inversion = domain_inversion.domain_inversion.bind(
            domain_inversion);
        var compare = Sao.common.compare;

        var domain = [['x', '=', 3]];
        var context;
        QUnit.assert.ok(compare(domain_inversion(domain, 'x'), [['x', '=', 3]]),
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\')');

        domain = [];
        QUnit.assert.strictEqual(domain_inversion(domain, 'x'), true,
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\')');
        QUnit.assert.strictEqual(domain_inversion(domain, 'y'), true,
            'domain_inversion(' + JSON.stringify(domain) + ', \'y\')');
        context = {x: 5};
        QUnit.assert.strictEqual(domain_inversion(domain, 'x', context),
            true, 'domain_inversion(' + JSON.stringify(domain) + ', \'x\', ' +
                JSON.stringify(context) + ')');
        context = {x: 7};
        QUnit.assert.strictEqual(domain_inversion(domain, 'z', context),
            true, 'domain_inversion(' + JSON.stringify(domain) + ', \'z\', ' +
                JSON.stringify(context) + ')');

        domain = [['x.id', '>', 5]];
        QUnit.assert.ok(compare(domain_inversion(domain, 'x'), [['x.id', '>', 5]]),
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\')');
    });

    QUnit.test('DomainInversion and_inversion', function() {
        var domain_inversion = new Sao.common.DomainInversion();
        domain_inversion = domain_inversion.domain_inversion.bind(
            domain_inversion);
        var compare = Sao.common.compare;

        var domain = [['x', '=', 3], ['y', '>', 5]];
        var context;
        QUnit.assert.ok(compare(domain_inversion(domain, 'x'), [['x', '=', 3]]),
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\')');
        context = {y: 4};
        QUnit.assert.strictEqual(domain_inversion(domain, 'x', context), false,
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\', ' +
                JSON.stringify(context) + ')');
        context = {y: 6};
        QUnit.assert.ok(compare(domain_inversion(domain, 'x', context),
                [['x', '=', 3]]),
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\', ' +
                JSON.stringify(context) + ')');

        domain = [['x', '=', 3], ['y', '=', 5]];
        QUnit.assert.strictEqual(domain_inversion(domain, 'z'), true,
            'domain_inversion(' + JSON.stringify(domain) + ', \'z\')');
        context = {x: 2, y: 7};
        QUnit.assert.strictEqual(domain_inversion(domain, 'z', context), true,
            'domain_inversion(' + JSON.stringify(domain) + ', \'z\', ' +
                JSON.stringify(context) + ')');
        context = {y: null};
        QUnit.assert.ok(compare(domain_inversion(domain, 'x', context),
                [['x', '=', 3]]),
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\', ' +
                JSON.stringify(context) + ')');

        domain = [['x.id', '>', 5], ['y', '<', 3]];
        QUnit.assert.ok(compare(domain_inversion(domain, 'y'), [['y', '<', 3]]),
            'domain_inversion(' + JSON.stringify(domain) + ', \'y\')');
        context = {x: 3};
        QUnit.assert.ok(compare(domain_inversion(domain, 'y', context),
                [['y', '<', 3]]),
            'domain_inversion(' + JSON.stringify(domain) + ', \'y\', ' +
                JSON.stringify(context) + ')');
        QUnit.assert.ok(compare(domain_inversion(domain, 'x'), [['x.id', '>', 5]]),
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\')');
    });

    QUnit.test('DomainInversion or_inversion', function() {
        var domain_inversion = new Sao.common.DomainInversion();
        domain_inversion = domain_inversion.domain_inversion.bind(
            domain_inversion);
        var compare = Sao.common.compare;

        var domain = ['OR', ['x', '=', 3], ['y', '>', 5], ['z', '=', 'abc']];
        var context;
        QUnit.assert.ok(compare(domain_inversion(domain, 'x'), true),
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\')');
        context = {y: 4};
        QUnit.assert.ok(compare(domain_inversion(domain, 'x', context), true),
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\', ' +
                JSON.stringify(context) + ')');
        context = {y: 4, z: 'ab'};
        QUnit.assert.ok(compare(domain_inversion(domain, 'x', context),
                [['x', '=', 3]]),
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\', ' +
                JSON.stringify(context) + ')');
        context = {y: 7};
        QUnit.assert.strictEqual(domain_inversion(domain, 'x', context), true,
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\', ' +
                JSON.stringify(context) + ')');
        context = {y: 7, z: 'b'};
        QUnit.assert.strictEqual(domain_inversion(domain, 'x', context), true,
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\', ' +
                JSON.stringify(context) + ')');
        context = {z: 'abc'};
        QUnit.assert.strictEqual(domain_inversion(domain, 'x', context), true,
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\', ' +
                JSON.stringify(context) + ')');
        context = {y: 4, z: 'abc'};
        QUnit.assert.strictEqual(domain_inversion(domain, 'x', context), true,
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\', ' +
                JSON.stringify(context) + ')');

        domain = ['OR', ['x', '=', 3], ['y', '=', 5]];
        context = {y: null};
        QUnit.assert.ok(compare(domain_inversion(domain, 'x', context),
                [['x', '=', 3]]),
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\', ' +
                JSON.stringify(context) + ')');

        domain = ['OR', ['x', '=', 3], ['y', '>', 5]];
        QUnit.assert.strictEqual(domain_inversion(domain, 'z'), true,
            'domain_inversion(' + JSON.stringify(domain) + ', \'z\')');

        domain = ['OR', ['x.id', '>', 5], ['y', '<', 3]];
        QUnit.assert.ok(compare(domain_inversion(domain, 'y'), true),
            'domain_inversion(' + JSON.stringify(domain) + ', \'y\',)');
        context = {z: 4};
        QUnit.assert.ok(compare(domain_inversion(domain, 'y', context), true),
            'domain_inversion(' + JSON.stringify(domain) + ', \'y\', ' +
                JSON.stringify(context) + ')');
        context = {x: 3};
        QUnit.assert.strictEqual(domain_inversion(domain, 'y', context), true,
            'domain_inversion(' + JSON.stringify(domain) + ', \'y\', ' +
                JSON.stringify(context) + ')');

        domain = ['OR', ['length', '>', 5], ['language.code', '=', 'de_DE']];
        context = {length: 0, name: 'n'};
        QUnit.assert.ok(compare(domain_inversion(domain, 'length', context), true),
            'domain_inversion(' + JSON.stringify(domain) + ', \'length\', ' +
                JSON.stringify(context) + ')');
    });

    QUnit.test('DomainInversion orand_inversion', function() {
        var domain_inversion = new Sao.common.DomainInversion();
        domain_inversion = domain_inversion.domain_inversion.bind(
            domain_inversion);
        var compare = Sao.common.compare;

        var domain = ['OR', [['x', '=', 3], ['y', '>', 5], ['z', '=', 'abc']],
        [['x', '=', 4]], [['y', '>', 6]]];
        var context;
        QUnit.assert.strictEqual(domain_inversion(domain, 'x'), true,
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\')');
        context = {y: 4};
        QUnit.assert.ok(compare(domain_inversion(domain, 'x', context), true),
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\', ' +
                JSON.stringify(context) + ')');
        context = {z: 'abc', y: 7};
        QUnit.assert.strictEqual(domain_inversion(domain, 'x', context), true,
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\', ' +
                JSON.stringify(context) + ')');
        context = {y: 7};
        QUnit.assert.strictEqual(domain_inversion(domain, 'x', context), true,
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\', ' +
                JSON.stringify(context) + ')');
        context = {z: 'ab'};
        QUnit.assert.strictEqual(domain_inversion(domain, 'x', context), true,
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\', ' +
                JSON.stringify(context) + ')');
    });

    QUnit.test('DomainInversion andor_inversion', function() {
        var domain_inversion = new Sao.common.DomainInversion();
        domain_inversion = domain_inversion.domain_inversion.bind(
            domain_inversion);
        var compare = Sao.common.compare;

        var domain = [['OR', ['x', '=', 4], ['y', '>', 6]], ['z', '=', 3]];
        var context;
        QUnit.assert.ok(compare(domain_inversion(domain, 'z'), [['z', '=', 3]]),
            'domain_inversion(' + JSON.stringify(domain) + ', \'z\')');
        context = {z: 3};
        QUnit.assert.ok(compare(domain_inversion(domain, 'z', context),
                [['z', '=', 3]]),
            'domain_inversion(' + JSON.stringify(domain) + ', \'z\', ' +
                JSON.stringify(context) + ')');
        context = {x: 5, y: 5};
        QUnit.assert.ok(compare(domain_inversion(domain, 'z', context),
                [['z', '=', 3]]),
            'domain_inversion(' + JSON.stringify(domain) + ', \'z\', ' +
                JSON.stringify(context) + ')');
        context = {x: 5, y: 7};
        QUnit.assert.ok(compare(domain_inversion(domain, 'z', context),
                [['z', '=', 3]]),
            'domain_inversion(' + JSON.stringify(domain) + ', \'z\', ' +
                JSON.stringify(context) + ')');
    });

    QUnit.test('DomainInversion andand_invertion', function() {
        var domain_inversion = new Sao.common.DomainInversion();
        domain_inversion = domain_inversion.domain_inversion.bind(
            domain_inversion);
        var compare = Sao.common.compare;

        var domain = [[['x', '=', 4], ['y', '>', 6]], ['z', '=', 3]];
        var context;
        QUnit.assert.ok(compare(domain_inversion(domain, 'z'), [['z', '=', 3]]),
            'domain_inversion(' + JSON.stringify(domain) + ', \'z\')');
        context = {x: 5};
        QUnit.assert.ok(compare(domain_inversion(domain, 'z', context), [['z', '=', 3]]),
            'domain_inversion(' + JSON.stringify(domain) + ', \'z\', ' +
                JSON.stringify(context) + ')');
        context = {y: 5};
        QUnit.assert.ok(compare(domain_inversion(domain, 'z', context),
                [['z', '=', 3]]),
            'domain_inversion(' + JSON.stringify(domain) + ', \'z\', ' +
                JSON.stringify(context) + ')');
        context = {x: 4, y: 7};
        QUnit.assert.ok(compare(domain_inversion(domain, 'z', context),
                [['z', '=', 3]]),
            'domain_inversion(' + JSON.stringify(domain) + ', \'z\', ' +
                JSON.stringify(context) + ')');

        domain = [[['x', '=', 4], ['y', '>', 6], ['z', '=', 2]],
        ['w', '=', 2]];
        context = {x: 4};
        QUnit.assert.ok(compare(domain_inversion(domain, 'z', context),
                [['z', '=', 2]]),
            'domain_inversion(' + JSON.stringify(domain) + ', \'z\', ' +
                JSON.stringify(context) + ')');
    });

    QUnit.test('DomainInversion oror_invertion', function() {
        var domain_inversion = new Sao.common.DomainInversion();
        domain_inversion = domain_inversion.domain_inversion.bind(
            domain_inversion);
        var compare = Sao.common.compare;

        var domain = ['OR', ['OR', ['x', '=', 3], ['y', '>', 5]],
        ['OR', ['x', '=', 2], ['z', '=', 'abc']],
        ['OR', ['y', '=', 8], ['z', '=', 'y']]];
        var context;
        QUnit.assert.strictEqual(domain_inversion(domain, 'x'), true,
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\')');
        context = {y: 4};
        QUnit.assert.strictEqual(domain_inversion(domain, 'x', context), true,
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\', ' +
                JSON.stringify(context) + ')');
        context = {z: 'ab'};
        QUnit.assert.strictEqual(domain_inversion(domain, 'x', context), true,
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\', ' +
                JSON.stringify(context) + ')');
        context = {y: 7};
        QUnit.assert.strictEqual(domain_inversion(domain, 'x', context), true,
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\', ' +
                JSON.stringify(context) + ')');
        context = {z: 'abc'};
        QUnit.assert.strictEqual(domain_inversion(domain, 'x', context), true,
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\', ' +
                JSON.stringify(context) + ')');
        context = {z: 'y'};
        QUnit.assert.strictEqual(domain_inversion(domain, 'x', context), true,
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\', ' +
                JSON.stringify(context) + ')');
        context = {y: 8};
        QUnit.assert.strictEqual(domain_inversion(domain, 'x', context), true,
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\', ' +
                JSON.stringify(context) + ')');
        context = {y: 8, z: 'b'};
        QUnit.assert.strictEqual(domain_inversion(domain, 'x', context), true,
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\', ' +
                JSON.stringify(context) + ')');
        context = {y: 4, z: 'y'};
        QUnit.assert.strictEqual(domain_inversion(domain, 'x', context), true,
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\', ' +
                JSON.stringify(context) + ')');
        context = {y: 7, z: 'abc'};
        QUnit.assert.strictEqual(domain_inversion(domain, 'x', context), true,
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\', ' +
                JSON.stringify(context) + ')');
        context = {y: 4, z: 'b'};
        QUnit.assert.ok(compare(domain_inversion(domain, 'x', context),
                ['OR', ['x', '=', 3], ['x', '=', 2]]),
            'domain_inversion(' + JSON.stringify(domain) + ', \'x\', ' +
                JSON.stringify(context) + ')');
    });

    QUnit.test('DomainInversion parse', function() {
        var domain_inversion = new Sao.common.DomainInversion();
        var parse = domain_inversion.parse.bind(domain_inversion);
        var compare = Sao.common.compare;

        var domain = parse([['x', '=', 5]]);
        QUnit.assert.ok(compare(domain.variables.sort(), ['x'].sort()));
        domain = parse(['OR', ['x', '=', 4], ['y', '>', 6]]);
        QUnit.assert.ok(compare(domain.variables.sort(), ['x', 'y'].sort()));
        domain = parse([['OR', ['x', '=', 4], ['y', '>', 6]], ['z', '=', 3]]);
        QUnit.assert.ok(compare(domain.variables.sort(), ['x', 'y', 'z'].sort()));
        domain = parse([[['x', '=', 4], ['y', '>', 6]], ['z', '=', 3]]);
        QUnit.assert.ok(compare(domain.variables.sort(), ['x', 'y', 'z'].sort()));
    });

    QUnit.test('DomainInversion simplify', function() {
        var domain_inversion = new Sao.common.DomainInversion();
        var simplify = domain_inversion.simplify.bind(domain_inversion);
        var compare = Sao.common.compare;

        [
            [[['x', '=', 3]], [['x', '=', 3]]],
            [[[['x', '=', 3]]], [['x', '=', 3]]],
            [
                [[['x', '=', 3], ['y', '=', 4]]], 
                [['x', '=', 3], ['y', '=', 4]]],
            [['OR', ['x', '=', 3]], [['x', '=', 3]]],
            [
                ['OR', [['x', '=', 3]], [['y', '=', 5]]],
                ['OR', ['x', '=', 3], ['y', '=', 5]]],
            [
                ['OR', ['x', '=', 3], ['AND', ['y', '=', 5]]],
                ['OR', ['x', '=', 3], ['y', '=', 5]]],
            [
                ['OR', ['x', '=', 1], ['OR', ['x', '=', 2], ['x', '=', 3]]],
                ['OR', ['x', '=', 1], ['x', '=', 2], ['x', '=', 3]]],
            [[['x', '=', 3], ['OR']], [['x', '=', 3]]],
            [['OR', ['x', '=', 3], []], []],
            [['OR', ['x', '=', 3], ['OR']], []],
            [[['x', '=', 3], []], [['x', '=', 3]]],
            [[['x', '=', 3], ['AND']], [['x', '=', 3]]],
            [['AND'], []],
            [['OR'], []]
        ].forEach(function(test) {
            var domain = test[0];
            var result = test[1];
            QUnit.assert.ok(compare(simplify(domain), result),
                'simplify(' + JSON.stringify(domain) + ')');
        });
    });

    QUnit.test('DomainInversion simplify deduplicate', function() {
        var domain_inversion = new Sao.common.DomainInversion();
        var simplify = domain_inversion.simplify.bind(domain_inversion);
        var compare = Sao.common.compare;

        var clause = ['x', '=', 3];
        var another = ['y', '=', 4];
        var third = ['z', '=', 5];
        [
            [[], []],
            [['OR', []], []],
            [['AND', []], []],
            [[clause], [clause]],
            [['OR', clause], [clause]],
            [[clause, clause], [clause]],
            [['OR', clause, clause], [clause]],
            [[clause, [clause, clause]], [clause]],
            [[clause, another], [clause, another]],
            [['OR', clause, another], ['OR', clause, another]],
            [[clause, clause, another], [clause, another]],
            [[clause, [clause, clause], another], [clause, another]],
            [[clause, clause, another, another], [clause, another]],
            [[clause, another, clause, another], [clause, another]],
            [
                ['AND', ['OR', clause, another], third],
                ['AND', ['OR', clause, another], third]],
        ].forEach(function(test) {
            var domain = test[0];
            var result = test[1];
            QUnit.assert.ok(compare(simplify(domain), result),
                'simplify(' + JSON.stringify(domain) + ')');
        });

    });

    QUnit.test('DomainInversion merge', function() {
        var domain_inversion = new Sao.common.DomainInversion();
        var merge = domain_inversion.merge.bind(domain_inversion);
        var compare = Sao.common.compare;

        [
        [[['x', '=', 6], ['y', '=', 7]],
            ['AND', ['x', '=', 6], ['y', '=', 7]]],
        [['AND', ['x', '=', 6], ['y', '=', 7]],
            ['AND', ['x', '=', 6], ['y', '=', 7]]],
        [[['z', '=', 8], ['AND', ['x', '=', 6], ['y', '=', 7]]],
            ['AND', ['z', '=', 8], ['x', '=', 6], ['y', '=', 7]]],
        [['OR', ['x', '=', 1], ['y', '=', 2], ['z', '=', 3]],
            ['OR', ['x', '=', 1], ['y', '=', 2], ['z', '=', 3]]],
        [['OR', ['x', '=', 1], ['OR', ['y', '=', 2], ['z', '=', 3]]],
            ['OR', ['x', '=', 1], ['y', '=', 2], ['z', '=', 3]]],
        [['OR', ['x', '=', 1], ['AND', ['y', '=', 2], ['z', '=', 3]]],
            ['OR', ['x', '=', 1], ['AND', ['y', '=', 2], ['z', '=', 3]]]],
        [[['z', '=', 8], ['OR', ['x', '=', 6], ['y', '=', 7]]],
            ['AND', ['z', '=', 8], ['OR', ['x', '=', 6], ['y', '=', 7]]]],
        [['AND', ['OR', ['a', '=', 1], ['b', '=', 2]],
                ['OR', ['c', '=', 3], ['AND', ['d', '=', 4], ['d2', '=', 6]]],
                ['AND', ['d', '=', 5], ['e', '=', 6]], ['f', '=', 7]],
            ['AND', ['OR', ['a', '=', 1], ['b', '=', 2]],
            ['OR', ['c', '=', 3], ['AND', ['d', '=', 4], ['d2', '=', 6]]],
            ['d', '=', 5], ['e', '=', 6], ['f', '=', 7]]]
        ].forEach(function(test) {
            var domain = test[0];
            var result = test[1];
            QUnit.assert.ok(compare(merge(domain), result),
                'merge(' + JSON.stringify(domain) + ')');
        });
    });

    QUnit.test('DomainInversion concat', function() {
        var domain_inversion = new Sao.common.DomainInversion();
        var concat = domain_inversion.concat.bind(domain_inversion);
        var compare = Sao.common.compare;

        var domain1 = [['a', '=', 1]];
        var domain2 = [['b', '=', 2]];

        QUnit.assert.ok(compare(concat([domain1, domain2]),
                ['AND', ['a', '=', 1], ['b', '=', 2]]),
            'compare(' + JSON.stringify([domain1, domain2]) + ')');
        QUnit.assert.ok(compare(concat([[], domain1]), domain1),
            'compare(' + JSON.stringify([[], domain1]) + ')');
        QUnit.assert.ok(compare(concat([domain2, []]), domain2),
            'compare(' + JSON.stringify([domain2, []]) + ')');
        QUnit.assert.ok(compare(concat([[], []]), []),
            'compare(' + JSON.stringify([[], []]) + ')');
        QUnit.assert.ok(compare(concat([domain1, domain2], 'OR'),
                ['OR', ['a', '=', 1], ['b', '=', 2]]),
            'compare(' + JSON.stringify([domain1, domain2]) + ', \'OR\')');
    });

    QUnit.test('DomainInversion unique_value', function() {
        var domain_inversion = new Sao.common.DomainInversion();
        var unique_value = domain_inversion.unique_value;
        var compare = Sao.common.compare;
        var domain = [['a', '=', 1]];
        QUnit.assert.ok(compare(unique_value(domain), [true, 'a', 1]));
        domain = [['a', '!=', 1]];
        QUnit.assert.ok(!unique_value(domain)[0]);
        domain = [['a', '=', 1], ['a', '=', 2]];
        QUnit.assert.ok(!unique_value(domain)[0]);
        domain = [['a.b', '=', 1]];
        QUnit.assert.ok(!unique_value(domain)[0]);
        domain = [['a.id', '=', 1, 'model']];
        QUnit.assert.ok(compare(unique_value(domain), [true, 'a.id', ['model', 1]]));
        domain = [['a.b.id', '=', 1, 'model']];
        QUnit.assert.ok(compare(unique_value(domain), [false, null, null]));
        QUnit.assert.ok(compare(unique_value(domain, false), [false, null, null]));
        domain = [['a', 'in', [1]]];
        QUnit.assert.ok(compare(unique_value(domain), [true, 'a', 1]));
        QUnit.assert.ok(compare(unique_value(domain, false), [false, null, null]));
        domain = [['a', 'in', [1, 2]]];
        QUnit.assert.ok(compare(unique_value(domain), [false, null, null]));
        domain = [['a', 'in', []]];
        QUnit.assert.ok(compare(unique_value(domain), [false, null, null]));
        domain = [['a.b', 'in', [1]]];
        QUnit.assert.ok(compare(unique_value(domain), [false, null, null]));
        domain = [['a.id', 'in', [1], 'model']];
        QUnit.assert.ok(compare(unique_value(domain), [true, 'a.id', ['model', 1]]));
        QUnit.assert.ok(compare(unique_value(domain, false), [false, null, null]));
    });

    QUnit.test('DomainInversion evaldomain', function() {
        var domain_inversion = new Sao.common.DomainInversion();
        var eval_domain = domain_inversion.eval_domain.bind(domain_inversion);

        var today = new Date();
        today.setHours(0);
        today.setMinutes(0);
        today.setSeconds(0);
        today.setMilliseconds(0);
        var now = new Date();

        [
        [[['x', '>', 5]], {'x': 6}, true],
        [[['x', '>', 5]], {'x': 4}, false],
        [[['x', '>', null]], {'x': today}, false],
        [[['x', '>', null]], {'x': now}, false],
        [[['x', '<', today]], {'x': null}, false],
        [[['x', '<', now]], {'x': null}, false],
        [[['x', 'in', [3, 5]]], {'x': 3}, true],
        [[['x', 'in', [3, 5]]], {'x': 4}, false],
        [[['x', 'in', [3, 5]]], {'x': [3]}, true],
        [[['x', 'in', [3, 5]]], {'x': [3, 4]}, true],
        [[['x', 'in', [3, 5]]], {'x': [1, 2]}, false],
        [[['x', 'in', [3, 5]]], {'x': null}, false],
        [[['x', 'in', [1, null]]], {'x': null}, true],
        [[['x', 'in', [1, null]]], {'x': 2}, false],
        [[['x', 'not in', [3, 5]]], {'x': 3}, false],
        [[['x', 'not in', [3, 5]]], {'x': 4}, true],
        [[['x', 'not in', [3, 5]]], {'x': [3]}, false],
        [[['x', 'not in', [3, 5]]], {'x': [3, 4]}, false],
        [[['x', 'not in', [3, 5]]], {'x': [1, 2]}, true],
        [[['x', 'not in', [3, 5]]], {'x': null}, false],
        [[['x', 'not in', [1, null]]], {'x': null}, false],
        [[['x', 'not in', [1, null]]], {'x': 2}, true],
        [[['x', 'like', 'abc']], {'x': 'abc'}, true],
        [[['x', 'like', 'abc']], {'x': ''}, false],
        [[['x', 'like', 'abc']], {'x': 'xyz'}, false],
        [[['x', 'like', 'abc']], {'x': 'abcd'}, false],
        [[['x', 'not like', 'abc']], {'x': 'xyz'}, true],
        [[['x', 'not like', 'abc']], {'x': 'ABC'}, true],
        [[['x', 'not like', 'abc']], {'x': 'abc'}, false],
        [[['x', 'not ilike', 'abc']], {'x': 'xyz'}, true],
        [[['x', 'not ilike', 'abc']], {'x': 'ABC'}, false],
        [[['x', 'not ilike', 'abc']], {'x': 'abc'}, false],
        [[['x', 'like', 'a%']], {'x': 'a'}, true],
        [[['x', 'like', 'a%']], {'x': 'abcde'}, true],
        [[['x', 'like', 'a%']], {'x': ''}, false],
        [[['x', 'like', 'a%']], {'x': 'ABCDE'}, false],
        [[['x', 'like', 'a%']], {'x': 'xyz'}, false],
        [[['x', 'ilike', 'a%']], {'x': 'a'}, true],
        [[['x', 'ilike', 'a%']], {'x': 'A'}, true],
        [[['x', 'ilike', 'a%']], {'x': ''}, false],
        [[['x', 'ilike', 'a%']], {'x': 'xyz'}, false],
        [[['x', 'like', 'a_']], {'x': 'ab'}, true],
        [[['x', 'like', 'a_']], {'x': 'a'}, false],
        [[['x', 'like', 'a_']], {'x': 'abc'}, false],
        [[['x', 'like', 'a\\%b']], {'x': 'a%b'}, true],
        [[['x', 'like', 'a\\%b']], {'x': 'ab'}, false],
        [[['x', 'like', 'a\\%b']], {'x': 'a123b'}, false],
        [[['x', 'like', '\\%b']], {'x': '%b'}, true],
        [[['x', 'like', '\\%b']], {'x': 'b'}, false],
        [[['x', 'like', '\\%b']], {'x': '123b'}, false],
        [[['x', 'like', 'a\\_c']], {'x': 'a_c'}, true],
        [[['x', 'like', 'a\\_c']], {'x': 'abc'}, false],
        [[['x', 'like', 'a\\_c']], {'x': 'ac'}, false],
        [[['x', 'like', 'a\\\\_c']], {'x': 'a\\bc'}, true],
        [[['x', 'like', 'a\\\\_c']], {'x': 'abc'}, false],
        [['OR', ['x', '>', 10], ['x', '<', 0]], {'x': 11}, true],
        [['OR', ['x', '>', 10], ['x', '<', 0]], {'x': -4}, true],
        [['OR', ['x', '>', 10], ['x', '<', 0]], {'x': 5}, false],
        [['OR', ['x', '>', 0], ['x', '=', null]], {'x': 1}, true],
        [['OR', ['x', '>', 0], ['x', '=', null]], {'x': null}, true],
        [['OR', ['x', '>', 0], ['x', '=', null]], {'x': -1}, false],
        [['OR', ['x', '>', 0], ['x', '=', null]], {'x': 0}, false],
        [[['x', '>', 0], ['OR', ['x', '=', 3], ['x', '=', 2]]],
            {'x': 1}, false],
        [[['x', '>', 0], ['OR', ['x', '=', 3], ['x', '=', 2]]],
            {'x': 3}, true],
        [[['x', '>', 0], ['OR', ['x', '=', 3], ['x', '=', 2]]],
            {'x': 2}, true],
        [[['x', '>', 0], ['OR', ['x', '=', 3], ['x', '=', 2]]],
            {'x': 4}, false],
        [[['x', '>', 0], ['OR', ['x', '=', 3], ['x', '=', 2]]],
            {'x': 5}, false],
        [[['x', '>', 0], ['OR', ['x', '=', 3], ['x', '=', 2]]],
            {'x': 6}, false],
        [['OR', ['x', '=', 4], [['x', '>', 6], ['x', '<', 10]]],
            {'x': 4}, true],
        [['OR', ['x', '=', 4], [['x', '>', 6], ['x', '<', 10]]],
            {'x': 7}, true],
        [['OR', ['x', '=', 4], [['x', '>', 6], ['x', '<', 10]]],
            {'x': 3}, false],
        [['OR', ['x', '=', 4], [['x', '>', 6], ['x', '<', 10]]],
            {'x': 5}, false],
        [['OR', ['x', '=', 4], [['x', '>', 6], ['x', '<', 10]]],
            {'x': 11}, false],
        [[['x', '=', 'test,1']], {'x': ['test', 1]}, true],
        [[['x', '=', 'test,1']], {'x': 'test,1'}, true],
        [[['x', '=', 'test,1']], {'x': ['test', 2]}, false],
        [[['x', '=', 'test,1']], {'x': 'test,2'}, false],
        [[['x', '=', ['test', 1]]], {'x': ['test', 1]}, true],
        [[['x', '=', ['test', 1]]], {'x': 'test,1'}, true],
        [[['x', '=', ['test', 1]]], {'x': ['test', 2]}, false],
        [[['x', '=', ['test', 1]]], {'x': 'test,2'}, false],
        [[['x', '=', 1]], {'x': [1, 2]}, true],
        [[['x', '=', 1]], {'x': [2]}, false],
        [[['x', '=', null]], {'x': []}, true],
        [[['x', '=', ['foo', 1]]], {'x': 'foo,1'}, true],
        [[['x', '=', ['foo', 1]]], {'x': ['foo', 1]}, true],
        [[['x', '=', 'foo,1']], {'x': ['foo', 1]}, true],
        ].forEach(function(test) {
            var domain = test[0];
            var context = test[1];
            var result = test[2];
            QUnit.assert.strictEqual(eval_domain(domain, context), result,
                'eval_domain(' + JSON.stringify(domain) + ', ' +
                    JSON.stringify(context) + ')');
        });
    });

    QUnit.test('DomainInversion localize', function() {
        var domain_inversion = new Sao.common.DomainInversion();
        var localize_domain = domain_inversion.localize_domain.bind(
            domain_inversion);
        var compare = Sao.common.compare;

        var domain = [['x', '=', 5]];
        QUnit.assert.ok(compare(localize_domain(domain), [['x', '=', 5]]),
            'localize_domain(' + JSON.stringify(domain) + ')');

        domain = [['x', '=', 5], ['x.code', '=', 7]];
        QUnit.assert.ok(compare(localize_domain(domain, 'x'),
                [['id', '=', 5], ['code', '=', 7]]),
            'localize_domain(' + JSON.stringify(domain) + ', \'x\')');

        domain = [['x', 'ilike', 'foo%'], ['x.code', '=', 'test']];
        QUnit.assert.ok(compare(localize_domain(domain, 'x'),
                [['rec_name', 'ilike', 'foo%'], ['code', '=', 'test']]),
            'localize_domain(' + JSON.stringify(domain) + ', \'x\')');

        domain = ['OR', ['AND', ['x', '>', 7], ['x', '<', 15]],
            ['x.code', '=', 8]];
        QUnit.assert.ok(compare(localize_domain(domain, 'x'),
                ['OR', ['AND', ['id', '>', 7], ['id', '<', 15]],
                    ['code', '=', 8]]),
            'localize_domain(' + JSON.stringify(domain) + ', \'x\')');

        domain = [['x', 'child_of', [1]]];
        QUnit.assert.ok(compare(localize_domain(domain, 'x'),
                [['x', 'child_of', [1]]]),
            'localize_domain(' + JSON.stringify(domain) + ', \'x\')');

        domain = [['x.y', 'child_of', [1], 'parent']];
        QUnit.assert.ok(compare(
            localize_domain(domain, 'x'),
            [['y', 'child_of', [1], 'parent']]),
            'localize_domain(' + JSON.stringify(domain) + ', \'x\')');

        domain = [['x.y.z', 'child_of', [1], 'parent', 'model']];
        QUnit.assert.ok(compare(
            localize_domain(domain, 'x'),
            [['y.z', 'child_of', [1], 'parent', 'model']]),
            'localize_domain(' + JSON.stringify(domain) + ', \'x\')');

        domain = [['x', 'child_of', [1], 'y']];
        QUnit.assert.ok(compare(localize_domain(domain, 'x'),
                [['y', 'child_of', [1]]]),
            'localize_domain(' + JSON.stringify(domain) + ', \'x\')');

        domain = [['x.id', '=', 1, 'y']];
        QUnit.assert.ok(compare(localize_domain(domain, 'x', false),
                [['id', '=', 1, 'y']]),
            'localize_domain(' + JSON.stringify(domain) + ', \'x\')');
        QUnit.assert.ok(compare(localize_domain(domain, 'x', true),
                [['id', '=', 1]]),
            'localize_domain(' + JSON.stringify(domain) + ', \'x\')');

        domain = [['a.b.c', '=', 1, 'y', 'z']];
        QUnit.assert.ok(compare(localize_domain(domain, 'x', false),
                [['b.c', '=', 1, 'y', 'z']]),
            'localize_domain(' + JSON.stringify(domain) + ', \'x\')');
        QUnit.assert.ok(compare(localize_domain(domain, 'x', true),
                [['b.c', '=', 1, 'z']]),
            'localize_domain(' + JSON.stringify(domain) + ', \'x\')');

    });

    QUnit.test('DomainInversion.prepare_reference_domain', function() {
        var domain_inversion = new Sao.common.DomainInversion();
        var prepare_reference_domain = domain_inversion
            .prepare_reference_domain.bind(domain_inversion);
        var compare = Sao.common.compare;

        var domain = [['x', 'like', 'A%']];
        QUnit.assert.ok(compare(
            prepare_reference_domain(domain, 'x'),
            [[]]));

        domain = [['x', '=', 'A']];
        QUnit.assert.ok(compare(
            prepare_reference_domain(domain, 'x'),
            [[]]));

        domain = [['x.y', 'child_of', [1], 'model', 'parent']];
        QUnit.assert.ok(compare(
            prepare_reference_domain(domain, 'x'),
            [['x.y', 'child_of', [1], 'model', 'parent']]));

        domain = [['x.y', 'like', 'A%', 'model']];
        QUnit.assert.ok(compare(
            prepare_reference_domain(domain, 'x'),
            [['x.y', 'like', 'A%', 'model']]));

        domain = [['x', '=', 'model,1']];
        QUnit.assert.ok(compare(
            prepare_reference_domain(domain, 'x'),
            [['x.id', '=', 1, 'model']]));

        domain = [['x', '!=', 'model,1']];
        QUnit.assert.ok(compare(
            prepare_reference_domain(domain, 'x'),
            [['x.id', '!=', 1, 'model']]));

        domain = [['x', '=', 'model,%']];
        QUnit.assert.ok(compare(
            prepare_reference_domain(domain, 'x'),
            [['x.id', '!=', null, 'model']]));

        domain = [['x', '!=', 'model,%']];
        QUnit.assert.ok(compare(
            prepare_reference_domain(domain, 'x'),
            [['x', 'not like', 'model,%']]));

        domain = [['x', 'in',
            ['model_a,1', 'model_b,%', 'model_c,3', 'model_a,2']]];
        QUnit.assert.ok(compare(
            prepare_reference_domain(domain, 'x'),
            [['OR',
                ['x.id', 'in', [1, 2], 'model_a'],
                ['x.id', '!=', null, 'model_b'],
                ['x.id', 'in', [3], 'model_c'],
                ]]));

        domain = [['x', 'not in',
            ['model_a,1', 'model_b,%', 'model_c,3', 'model_a,2']]];
        QUnit.assert.ok(compare(
            prepare_reference_domain(domain, 'x'),
            [['AND',
                ['x.id', 'not in', [1, 2], 'model_a'],
                ['x', 'not like', 'model_b,%'],
                ['x.id', 'not in', [3], 'model_c'],
                ]]));

        domain = [['x', 'in', ['model_a,1', 'foo']]];
        QUnit.assert.ok(compare(
            prepare_reference_domain(domain, 'x'),
            [[]]));
    });

    QUnit.test('DomainInversion.extract_reference_models', function() {
        var domain_inversion = new Sao.common.DomainInversion();
        var extract_reference_models = domain_inversion
            .extract_reference_models.bind(domain_inversion);
        var compare = Sao.common.compare;

        var domain = [['x', 'like', 'A%']];
        QUnit.assert.ok(compare(
            extract_reference_models(domain, 'x'),
            []));
        QUnit.assert.ok(compare(
            extract_reference_models(domain, 'y'),
            []));

        domain = [['x', 'like', 'A%', 'model']];
        QUnit.assert.ok(compare(
            extract_reference_models(domain, 'x'),
            ['model']));
        QUnit.assert.ok(compare(
            extract_reference_models(domain, 'y'),
            []));

        domain = ['OR',
            ['x', 'like', 'A%', 'model_A'],
            ['x', 'like', 'B%', 'model_B']
        ];
        QUnit.assert.ok(compare(
            extract_reference_models(domain, 'x'),
            ['model_A', 'model_B']));
        QUnit.assert.ok(compare(
            extract_reference_models(domain, 'y'),
            []));
    });

    QUnit.test('DomainInversion.sort', function() {
        var domain_inversion = new Sao.common.DomainInversion();
        var sort = domain_inversion.sort.bind(domain_inversion);
        var tests = [
            [[], []],
            [['AND'], ['AND']],
            [['OR'], ['OR']],
            [[['foo', '=', 1]], [['foo', '=', 1]]],
            [[['foo', '=', 1000], ['foo', '=', 0]],
                [['foo', '=', 0], ['foo', '=', 1000]]],
            [[['foo', '=', 1], ['foo', '=', null]],
                [['foo', '=', null], ['foo', '=', 1]]],
            [[['foo', '=', 1], []], [[], ['foo', '=', 1]]],
            [[[[[['foo', '=', 1]]]], [[['foo', '=', 1]]]],
                [[[['foo', '=', 1]]], [[[['foo', '=', 1]]]]]],
            [[[['foo', '=', 1], ['bar', '=', 2]],
                [['foo', '=', 1], ['bar', '=', 2], ['baz', '=', 3]]],
                [[['bar', '=', 2], ['baz', '=', 3], ['foo', '=', 1]],
                    [['bar', '=', 2], ['foo', '=', 1]]]],
            [['OR', ['foo', '=', 1], ['foo', '=', null],
                ['AND', ['bar', '=', 2], ['baz', '=', 3]]],
                ['OR', ['foo', '=', null], ['foo', '=', 1],
                    ['AND', ['bar', '=', 2], ['baz', '=', 3]]]],
            [[['foo', '=', 'bar'], ['foo', '=', null]],
                [['foo', '=', 'bar'], ['foo', '=', null]]],
        ];
        for (const [domain, expected] of tests) {
            QUnit.assert.deepEqual(sort(domain), expected);
        }
    });

    QUnit.test('DomainInversion.canonicalize', function() {
        var domain_inversion = new Sao.common.DomainInversion();
        var canonicalize = domain_inversion.canonicalize.bind(domain_inversion);
        var tests = [
                [[], []],
                [['AND'], []],
                [['OR'], []],
                [[['foo', '=', 1], ['bar', '=', 2]],
                    [['bar', '=', 2], ['foo', '=', 1]]],
                [[[['foo', '=', 1]]], [['foo', '=', 1]]],
                [['AND', ['OR', ['bar', '=', 2], ['baz', '=', 3]],
                        ['foo', '=', 1]],
                    [['foo', '=', 1],
                        ['OR', ['bar', '=', 2], ['baz', '=', 3]]]],
                [['OR', ['AND', ['bar', '=', 2], ['baz', '=', 3]],
                        ['foo', '=', 1]],
                    ['OR', ['foo', '=', 1],
                        [['bar', '=', 2], ['baz', '=', 3]]]],
                [['AND', ['AND', ['bar', '=', 2], ['baz', '=', 3]],
                        ['foo', '=', 1]],
                    [['bar', '=', 2], ['baz', '=', 3], ['foo', '=', 1]]],
                [['OR', ['OR', ['bar', '=', 2], ['baz', '=', 3]],
                        ['foo', '=', 1]],
                    ['OR', ['bar', '=', 2], ['baz', '=', 3], ['foo', '=', 1]]],
        ];
        for (const [domain, expected] of tests) {
            QUnit.assert.deepEqual(expected, canonicalize(domain));
        }
    });

    QUnit.test('DomainParser.completion', function() {
        var compare = Sao.common.compare;
        var parser = new Sao.common.DomainParser({
            'name': {
                'string': 'Name',
                'name': 'name',
                'type': 'char'
            }
        });

        [
        ['Nam', ["Name: "]],
        ['Name:', ['Name: ']],
        ['Name: foo', []],
        ['Name: !=', []],
        ['Name: !=foo', []],
        ['', ["Name: "]],
        [' ', ["", "Name: "]],
        ["Name: foo |", ["Name: foo"]],
        ['Name: foo (Name: foo | N', ["Name: foo (Name: foo | Name: "]],
        ].forEach(function(test) {
            var value = test[0];
            var expected = test[1];
            QUnit.assert.ok(compare(parser.completion(value), expected),
                'completion(' + value + ')');
        });

        parser = new Sao.common.DomainParser({
            'relation': {
                'name': 'relation',
                'string': "Relation",
                'type': 'many2one',
                'relation_fields': {
                    'name': {
                        'name': 'name',
                        'string': "Name",
                        'type': 'char',
                    },
                },
            },
        });
        QUnit.assert.ok(compare(parser.completion('Relatio'),
            ["Relation: ", "Relation.Name: "]));

        parser = new Sao.common.DomainParser({
            'name': {
                'string': "Active",
                'name': 'active',
                'type': 'boolean',
            },
        });
        QUnit.assert.ok(compare(parser.completion("Act"), ["Active: "]));
        QUnit.assert.ok(compare(parser.completion("Active:"),
            ["Active: ", "Active: True", "Active: False"]));
        QUnit.assert.ok(compare(parser.completion("Active: t"),
            ["Active: True", "Active: False"]));
        QUnit.assert.ok(compare(parser.completion("Active: f"),
            ["Active: False", "Active: True"]));
    });

    QUnit.test('Date.toString', function() {
        QUnit.assert.strictEqual(Sao.Date(2020, 8, 11).toString(), '2020-09-11');
    });

    QUnit.test('DateTime.toString', function() {
        QUnit.assert.strictEqual(
            Sao.DateTime(2020, 8, 11, 10, 30, 42).toString(),
            '2020-09-11 10:30:42');

        QUnit.assert.strictEqual(
            Sao.DateTime(2020, 8, 11, 10, 30, 42, 123).toString(),
            '2020-09-11 10:30:42.123000');
    });

    QUnit.test('Time.toString', function() {
        QUnit.assert.strictEqual(Sao.Time(10, 30, 42).toString(), '10:30:42');

        QUnit.assert.strictEqual(
            Sao.Time(10, 30, 42, 123).toString(), '10:30:42.123000');
    });

    QUnit.test('HTML Sanitization', function() {
        var examples = [
            ["Test", "Test"],
            ["<b>Test</b>", "<b>Test</b>"],
            ["<div><b>Test</b></div>", "<div><b>Test</b></div>"],
            ["<script>window.alert('insecure')</script>", ""],
            ["<b><script>window.alert('insecure')</script>Test</b>",
                "<b>Test</b>"],
            ['<div align="left">Test</div>', '<div align="left">Test</div>'],
            ['<font href="test" size="1">Test</font>',
                '<font size="1">Test</font>'],
            ["<p>Test</p>", "Test"],
        ];
        for (var i = 0; i < examples.length; i++) {
            var input = examples[i][0], output = examples[i][1];
            QUnit.assert.strictEqual(Sao.HtmlSanitizer.sanitize(input), output,
                'Sao.HtmlSanitizer.sanitize(' + input + ')');
        }
    });
}());
