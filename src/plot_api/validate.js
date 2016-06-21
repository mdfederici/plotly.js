/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';


var Lib = require('../lib');
var Plots = require('../plots/plots');
var PlotSchema = require('./plot_schema');

var isPlainObject = Lib.isPlainObject;

// validation error codes
var code2msgFunc = {
    visible: function(_) {
        return 'trace ' + _ + ' got defaulted to be not visible';
    },
    schema: function(_) {
        return 'key ' + _[0] + _[1] + ' is not part of the schema';
    },
    unsettable: function(_) {
        var prefix = isPlainObject(_[2]) ? 'container' : 'key';

        return prefix + ' ' + _[0] + _[1] + ' did not get coerced';
    },
    value: function(_) {
        return 'key ' + _[0] + _[1] + ' is set to an invalid value (' + _[2] + ')';
    }
};

module.exports = function valiate(data, layout) {
    if(!Array.isArray(data)) {
        throw new Error('data must be an array');
    }

    if(!isPlainObject(layout)) {
        throw new Error('layout must be an object');
    }

    var gd = {
        data: Lib.extendDeep([], data),
        layout: Lib.extendDeep({}, layout)
    };
    Plots.supplyDefaults(gd);

    var schema = PlotSchema.get();

    var dataOut = gd._fullData,
        len = data.length,
        dataList = new Array(len);

    for(var i = 0; i < len; i++) {
        var traceIn = data[i];
        var traceList = dataList[i] = [];

        if(!isPlainObject(traceIn)) {
            throw new Error('each data trace must be an object');
        }

        var traceOut = dataOut[i],
            traceType = traceOut.type,
            traceSchema = schema.traces[traceType].attributes;

        // PlotSchema does something fancy with trace 'type', reset it here
        // to make the trace schema compatible with Lib.isValid.
        traceSchema.type = {
            valType: 'enumerated',
            values: [traceType]
        };

        if(traceOut.visible === false && !('visible' in traceIn)) {
            traceList.push(format('visible', i));
        }

        crawl(traceIn, traceOut, traceSchema, traceList, '');
    }

    var layoutOut = gd._fullLayout,
        layoutSchema = fillLayoutSchema(schema, dataOut),
        layoutList = [];

    crawl(layout, layoutOut, layoutSchema, layoutList, '');

    return {
        data: dataList,
        layout: layoutList
    };
};

function crawl(objIn, objOut, schema, list, root) {
    var keys = Object.keys(objIn);

    for(var i = 0; i < keys.length; i++) {
        var k = keys[i];

        var valIn = objIn[k],
            valOut = objOut[k];

        if(isPlainObject(valIn) && isPlainObject(valOut)) {
            crawl(valIn, valOut, schema[k], list, k + '.');
        }
        else if((k in objIn) && !(k in schema)) {
            list.push(format('schema', [root, k]));
        }
        else if((k in objIn) && !(k in objOut)) {
            list.push(format('unsettable', [root, k, valIn]));
        }
        else if(!Lib.isValid(objIn, schema, k)) {
            list.push(format('value', [root, k, valIn]));
        }
    }

    return list;
}

// the 'full' layout schema depends on the traces types presents
function fillLayoutSchema(schema, dataOut) {
    for(var i = 0; i < dataOut.length; i++) {
        var traceType = dataOut[i].type,
            traceLayoutAttr = schema.traces[traceType].layoutAttributes;

        if(traceLayoutAttr) {
            Lib.extendFlat(schema.layout.layoutAttributes, traceLayoutAttr);
        }
    }

    return schema.layout.layoutAttributes;
}

function format(code, args) {
    return {
        code: code,
        msg: code2msgFunc[code](args)
    };
}
