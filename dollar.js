#!/usr/bin/env node

"use strict";

const request = require('request');
const notifier = require('node-notifier');
const path = require('path');
const VERSION = "1.0.0";
var prev_exchange = undefined;

/* ------------------------------------------------------------------------ *
 * Helper Functions
 * ------------------------------------------------------------------------ */

function seg(val)
{
    return val * 1000;
}

function min(val)
{
    return val * seg(60)
}

function hour(val)
{
    return val * min(60)
}

function round2digits(val)
{
    return Math.round(val*100)/100;
}

function round4digits(val)
{
    return Math.round(val*10000)/10000;
}

function* gen_args()
{
    for(let i = 2; i < process.argv.length; i++)
    {
        yield process.argv[i];
    }

    return undefined;
}

function parseArgs()
{
    var result = {};

    var args = gen_args();

    var arg = args.next();

    while( ! arg.done )
    {

        if(arg.value[0] == '-')
        {
            var new_arg = args.next();

            if( ! new_arg.done )
            {

                if(new_arg.value[0] == '-')
                {
                    result[arg.value] = true;
                }
                else
                {
                    result[arg.value] = new_arg.value;
                }
            }
            else
            {
                result[arg.value] = true;
            }           
        }

        arg = args.next();
    }

    return result;
}

function get_def(val, def)
{
    return val == undefined ? def : val;
}

function is_undefined(val)
{
    return val == undefined;
}

function is_defined(val)
{
    return val != undefined;
}

function is_false(val)
{
    return val == false;
}

function empty_obj(obj)
{
    return Object.keys(obj).length == 0
}

function notify(title, message)
{
    notifier.notify({
      'title': title,
      'message': message,
      'icon': path.join(__dirname, 'dollar.png')
    });
}

function get_exchange_rate(from, to, handle)
{
    var url = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.xchange%20where%20pair%20in%20(%22'+from+to+'%22)&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=';
    
    request(url, function(error, response, body){
        if( ! error && response.statusCode == 200)
        {
            var result = JSON.parse(body);

            try{
                handle(result.query.results.rate.Rate);
            }
            catch(e)
            {
                console.error(e.stack);
                handle(null);
            }
        }
        else
        {
            handle(null);
        }
    });
}

function paypal(exchange, value)
{
    return ((exchange*value)/2219.2) * 2121.73
}

function replace(str, obj)
{
    for(var key in obj)
    {
        str = str.replace(new RegExp('{'+key+'}', 'g'), obj[key]);
    }

    str = str.replace(/{[^}]+}/g, '');

    return str;
}

function append_plus_signal(val)
{
    return val >= 0.0 ? ('+' + val) : val ;
}

/* ------------------------------------------------------------------------ *
 * Core Functions
 * ------------------------------------------------------------------------ */

function version()
{
    console.log("Dollar The Dog v" + VERSION);
    console.log("My personal Currency and Paypal Watcher");
}

function help()
{
    console.log("usage: dollar <commands> [<args>]\n");
    console.log("These are the dollar commands used in various situations:\n");
    console.log("   -t\t\tTime to request again. valid notation: s(seconds), m(minutes) and h(hours). e.g. 10m");
    console.log("   -o\t\tOrigin currency. Default USD");
    console.log("   -d\t\tdestiny currency. Default BRL");
    console.log("   -e\t\tpaypal value in origin currency to convert to destiny currency");
    console.log("   -v\t\tdollar's version");
    console.log("   -h\t\tdollar's help message");
}

function proccess_request(value, from, to)
{
    get_exchange_rate(from, to, function(exchange) {
        if(is_undefined(exchange))
        {
            notify('Dollar The Dog', 'Something wrong happened with the request!');
        }
        else
        {
            var msg = "1 {from} → {exchange} {to}\n", keys = {};

            keys.to = to;
            keys.from = from;
            keys.exchange = exchange;

            if(is_defined(prev_exchange))
            {
                msg += "{to} {prev} → ";

                keys.prev = prev_exchange;
                
                if(exchange > prev_exchange)
                {
                    keys.arrow = ' ↑ ('+append_plus_signal(round4digits(exchange-prev_exchange))+')';
                }
                else if(exchange < prev_exchange)
                {
                    keys.arrow = ' ↓ ('+append_plus_signal(round4digits(exchange-prev_exchange))+')';
                }
            }

            msg += "{to} {new}{arrow}";

            keys.new = exchange;

            if(is_defined(value))
            {
                msg += "\nPaypal (Estimated): {from} {money} → {to} {val}";
                keys.money = round2digits(value);
                keys.val = round2digits(paypal(exchange, value));
            }

            msg = replace(msg, keys);

            notify('Dollar The Dog', msg);

            prev_exchange = exchange;
        }
    });
}

/* ------------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------------ */

 function main()
 {
    var args = parseArgs();

    if( empty_obj(args) || is_defined(args['-v']) )
    {
        help();
        return;
    }

    if(is_defined(args['-v']))
    {
        version();
    }

    var value = args['-e'];

    var refresh, time = args['-t'];

    var from = get_def(args['-o'], 'USD');

    var to = get_def(args['-d'], 'BRL');

    proccess_request(value, from, to);

    if( is_defined(time) )
    {
        switch(time[time.length-1])
        {
            case 's':
                refresh = seg(time.substr(0, time.length-1));
                break;
            case 'm':
                refresh = min(time.substr(0, time.length-1));
                break;
            case 'h':
                refresh = hour(time.substr(0, time.length-1));
                break;
        }

        setInterval(function(){
            proccess_request(value, from, to);
        }, refresh); 
    }
 }

/* ------------------------------------------------------------------------ *
 * Bootstrap
 * ------------------------------------------------------------------------ */
main();