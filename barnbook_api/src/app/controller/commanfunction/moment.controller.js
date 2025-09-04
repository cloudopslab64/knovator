const Model = require("../../models");
const fs = require("fs");
const path = require("path");
// const readXlsxFile = require("read-excel-file/node");
const XLSX = require("xlsx");
const fastcsv = require("fast-csv");
const moment = require("moment");
const nodemailer = require("nodemailer");
var http = require("http");
// const { sendMessage, getTextMessageInput } = require("../../middleware/whatappMessage.middleware");
const axios = require('axios');
var response = require("../../middleware/response.middleware");

// calculate financial year based on current date
function calculateFinancialYear(date) {
    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth() + 1; // Months are zero-based

    // Financial year starts from April (4th month)
    const financialYearStartMonth = 4;

    // If the current month is before April, subtract 1 from the current year
    const financialYear = currentMonth < financialYearStartMonth ? currentYear - 1 : currentYear;

    // The financial year is represented as a string with the format "YYYY-YY" (e.g., "2022-23")
    const financialYearString = financialYear.toString().substring(2) + '-' + (financialYear + 1).toString().substring(2);

    return financialYearString;  // output : 23-24
}

function getDailyRecords(data) {
    const startDate = new Date('2022-07-01');
    const endDate = new Date('2022-08-03');
    const dailyRecords = data.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= startDate && recordDate <= endDate;
    });

    return dailyRecords;
}

// startDate & endDate format YYYY-MM-DD, unit should be in 'days', 'months', 'years', 'hours', 'minutes', 'seconds'
function getDateDifference(startDate, endDate, unit = 'days') {
    const startMoment = moment(startDate);
    const endMoment = moment(endDate);
    if (!startMoment.isValid() || !endMoment.isValid()) {
        throw new Error('Invalid date format. Please provide valid dates.');
    }
    return endMoment.diff(startMoment, unit);
}

// add or substract function 
// date format YYYY-MM-DD, operation = add or substract, days = how to many days add or substract
function addOrSubtractFromDate(date, value, unit = 'days', operation) {
    const inputDate = moment(date);

    if (!inputDate.isValid()) {
        throw new Error('Invalid date format. Please provide a valid date.');
    }

    if (operation === 'add') {
        return inputDate.add(value, unit);
    } else if (operation === 'subtract') {
        return inputDate.subtract(value, unit);
    } else {
        throw new Error('Invalid operation. Please use "add" or "subtract".');
    }
}

module.exports = {
    calculateFinancialYear, getDailyRecords, getDateDifference, addOrSubtractFromDate
};

