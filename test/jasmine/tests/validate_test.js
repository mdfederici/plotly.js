var Plotly = require('@lib/index');

describe('Plotly.validate', function() {

    it('should report when trace is defaulted to not be visible', function() {
        var out = Plotly.validate([{
            type: 'scatter'
            // missing 'x' and 'y
        }], {});

        expect(out.data[0][0].code).toEqual('visible');
    });

    it('should report when trace contains keys not part of the schema', function() {
        var out = Plotly.validate([{
            x: [1, 2, 3],
            markerColor: 'blue'
        }], {});

        expect(out.data[0][0].code).toEqual('schema');
    });

    it('should report when trace contains keys that are not coerced', function() {
        var out = Plotly.validate([{
            x: [1, 2, 3],
            mode: 'lines',
            marker: { color: 'blue' }
        }, {
            x: [1, 2, 3],
            mode: 'markers',
            marker: {
                color: 'blue',
                cmin: 10
            }
        }], {});

        expect(out.data[0][0].code).toEqual('unsettable');
        //console.log(out.data[0][0].msg)

        expect(out.data[1][0].code).toEqual('unsettable');
        //console.log(out.data[1][0].msg)
    });

    it('should report when trace contains keys set to invalid values', function() {
        var out = Plotly.validate([{
            x: [1, 2, 3],
            mode: 'lines',
            line: { width: 'a big number' }
        }, {
            x: [1, 2, 3],
            mode: 'markers',
            marker: { color: 10 }
        }], {});

        expect(out.data[0][0].code).toEqual('value');
        //console.log(out.data[0][0].msg)

        expect(out.data[1][0].code).toEqual('value');
        //console.log(out.data[1][0].msg)
    });
});
