#!/usr/bin/env node

"use strict";

const request = require('request');
const notifier = require('node-notifier');
const VERSION = "0.0.1";

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
    console.log("   -t\t\tTime to request again. valid notation: s(seconds), m(minutes) and h(hours)");
    console.log("   -o\t\tOrigin currency");
    console.log("   -d\t\tdestiny currency");
    console.log("   -l\t\tpaypal value in origin currency to convert to destiny currency");
    console.log("   -v\t\tdollar's version");
    console.log("   -h\t\tdollar's help message");
}

/* ------------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------------ */

 function main()
 {
    var args = parseArgs();

    if( Object.keys(args).length == 0 || args['-h'] != undefined)
    {
        help();
        return;
    }

    if(args['-v']!= undefined)
    {
        version();
    }

    /*var valor_receber = args['-v'];

    var tempo = args['-t'] == undefined ? min(5) : args['-t'];

    var de = args['-d'] == undefined ? 'USD' : args['-d'];

    var para = args['-p'] == undefined ? 'BRL' : args['-p'];

    switch(tempo[tempo.length-1])
    {
        case 's':
            tempo = seg(tempo.substr(0, tempo.length-1));
            break;
        case 'm':
            tempo = min(tempo.substr(0, tempo.length-1));
            break;
        case 'h':
            tempo = hour(tempo.substr(0, tempo.length-1));
            break;
    }

    cotacao(valor_receber, de, para);

    setInterval(function(){
        cotacao(valor_receber, de, para);
    }, tempo); */
 }

/* ------------------------------------------------------------------------ *
 * Bootstrap
 * ------------------------------------------------------------------------ */
main();