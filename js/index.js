const currencyUrl = 'https://free.currencyconverterapi.com/api/v5/currencies';
const exchangeUrl = 'https://free.currencyconverterapi.com/api/v5/convert?compact=ultra&q=';
const currencyArr = [];
var selectFrom;
var selectTo;
var query = selectFrom + '_' + selectTo;
var dbName = 'cc-database';
var dbVersion = 1;
var rateObjectStore = 'exchange-rates';

window.indexedDB =  window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"};

window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

if (!window.indexedDB) {
    window.alert("Your browser doesn't support a stable version of IndexedDB.")
}

var db;

var request = window.indexedDB.open(dbName, dbVersion);

request.onerror = function (event) {
    console.log('Error, ',  event.target.errorCode)
}

request.onsuccess = function (event) { 
    db = event.target.result;
    console.log('Success, ', db)
}

request.onupgradeneeded = function (event) { 
    console.log('onUpgrate')
    var thisDB = event.target.result;
    
    if(!thisDB.objectStoreNames.contains(rateObjectStore)) {
        thisDB.createObjectStore(rateObjectStore, { keyPath: 'fromto'});
    }
}

readRateData = (fromto) => {
    var transaction = db.transaction([rateObjectStore]);
    var objectStore = transaction.objectStore(rateObjectStore);
    var request = objectStore.get(fromto);
    var rate;

    request.onerror = function (event) {
        console.error('Error getting', fromto)
    }

    request.onsuccess = function (event) { 
        if(request.result) {
            console.log(request.result)
            rate = request.result[fromto]
         } else {
            console.log(fromto, "couldn't be found in your database!");
            rate = 0;
         }
     }

     return rate;
}

addRateToDb = (data) => {
    var request = db.transaction([rateObjectStore], 'readwrite')
        .objectStore(rateObjectStore)
        .put(data);

    request.onerror = function (event) { 
        console.log('error adding new data',  event.target.errorCode)
    }

    request.onsuccess = () => {
        console.log('success adding new data')
    }
}

updateInput = (xrate) => {
    var rate = xrate;
    
    console.log(rate)
    if (rate !== 'undefined' || typeof(rate) !== 'undefined') {
        $('#inputFrom').val(1)
        $('#inputTo').val(1*rate)

        $("#inputFrom").on("change paste keyup", function() {
            $('#inputTo').val($(this).val()*rate)
         });

         $("#inputTo").on("change paste keyup", function() {
            $('#inputFrom').val($(this).val()/rate)
         });
    }
}

fetchExchangeRate = () => {

    if (!query.includes('undefined')) {
        let url = exchangeUrl + query;
        let rateObj;
        $.get(url, (data) => {
            if (typeof(data) !== 'undefined') {
                rateObj = data;
                rateObj['fromto'] = query;
                addRateToDb(rateObj);
                updateInput(data[query])
            }
        })
    }
}

getSelectedOptionFromTo = () => {
    $("#selectFrom").change(function(event) {
        selectFrom = $(this).val().toString();
        query = selectFrom + '_' + selectTo;
        if (!query.includes('undefined')) {
            fetchExchangeRate();
        }
    });

    $("#selectTo").change(function(event) {
        selectTo = $(this).val().toString();
        query = selectFrom + '_' + selectTo;
        if (!query.includes('undefined')) {
            fetchExchangeRate();
        }
    });
}

fetchAndPopulateSelectOptions = () => {
    $.get(currencyUrl, (data) => {
        if (typeof(data) !== 'undefined'){
            let dataObj = data.results
            for (const key of Object.keys(dataObj)) {
                currencyArr.push(
                    `<Option value="${dataObj[key]['id']}">${dataObj[key]['currencyName']}</Option>`
                );
            }
            for (const item of currencyArr) {
                $('#selectFrom').append(item);
                $('#selectTo').append(item);
            }
        }
    });
}

$(document).ready(() => {
    fetchAndPopulateSelectOptions();
    getSelectedOptionFromTo();
});
