/*
 * @author     Martin Høgh <mh@mapcentia.com>
 * @copyright  2013-2019 MapCentia ApS
 * @license    http://www.gnu.org/licenses/#AGPL  GNU AFFERO GENERAL PUBLIC LICENSE 3
 */

var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('../../../config/config.js');

router.get('/api/extension/cowiplan_filter/:db', function (req, response) {
    var params = req.query.params;
    var uuid = req.query.uuid;
    var width = req.query.width;
    var height = req.query.height;
    var db = req.params.db;
    var dim;

    if (typeof width !== "undefined" && typeof height !== "undefined") {
        dim = `&width=${width}&height=${height}`
    } else {
        dim = `&width=991&height=600`
    }

    console.log(dim);


    if (db.split("@").length > 1) {
        db = db.split("@")[1];
    }


    var call = config.gc2.host + "/api/v2/preparedstatement/" + db + "/?params=" + params + "&uuid=" + uuid + "&srs=25832";

    var options = {
        method: 'GET',
        uri: call
    };

    console.log(options);

    request.get(options,
        function (err, res, body) {
            if (err) {
                response.header('content-type', 'application/json');
                response.status(400).send({
                    success: false,
                    message: "Could not get the meta data."
                });

                return;
            }
            var json = JSON.parse(body);

            if (json.features.length > 0 && typeof json.features[0].properties !== "undefined" && typeof json.features[0].properties.planid !== "undefined") {
                let buff = new Buffer.from(JSON.stringify({
                    [json.auth_check.checked_relations[0]]: {
                        "match": "any",
                        "columns": [
                            {
                                "fieldname": "planid",
                                "expression": "=",
                                "value": json.features[0].properties.planid,
                                "restriction": false
                            }
                        ]
                    }
                }));

                var call2 = "http://127.0.0.1:3000/api/static/" + db + "/_cowiplan/?filter=" + buff.toString('base64') + dim;
                var options = {
                    method: 'GET',
                    uri: call2
                };
                console.log(options);

                request(options).pipe(response);

            } else {
                response.status(400).send({
                    success: false,
                    message: "Could not get data."
                });
                return;
            }
        }
    )
});

module.exports = router;