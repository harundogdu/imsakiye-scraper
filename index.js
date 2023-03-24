require('dotenv').config();
const axios = require('axios');
const express = require('express');
const cheerio = require('cheerio');
const moment = require('moment');
const cors = require('cors');

const {ucWords} = require('./lib/helper')
const {cities} = require('./lib/cities');

const localization = require('moment/locale/tr');
moment.updateLocale('tr', localization);

const PORT = process.env.PORT || 1453;
const app = express();
app.use(cors({origin: '*'}));

const fetchMuslimSalah = async (city) => {
    const url = `${process.env.BASE_API_URL}${city}-iftar-vakti/`;
    const {data: html} = await axios.get(url);
    const $ = cheerio.load(html);
    const table = $(".imsakiye-table");
    const rows = table.find("tbody tr");
    const ramadanTimes = [];

    rows.each((index, row) => {
        const columns = $(row).find("td");
        const date = columns.eq(0).text().trim();
        const fajr = columns.eq(1).text().trim();
        const sunrise = columns.eq(2).text().trim();
        const dhuhr = columns.eq(3).text().trim();
        const asr = columns.eq(4).text().trim();
        const maghrib = columns.eq(5).text().trim();
        const isha = columns.eq(6).text().trim();

        ramadanTimes.push({
            city: ucWords(city),
            date,
            dateTime: index === 0 ? moment().add(-1, 'day').format('YYYY-MM-DD') : moment().add(--index, 'days').format('YYYY-MM-DD'),
            times: {
                fajr,
                sunrise,
                dhuhr,
                asr,
                maghrib,
                isha
            }
        });
    });

    return ramadanTimes;
}

app.get('/', async (req, res) => {
    const ramadanTimes = await fetchMuslimSalah(req.query.city);
    res.json(ramadanTimes);
})

app.get('/cities', (req, res) => {
    res.json(cities);
});

app.get('/today', async (req, res) => {
    const ramadanTimes = await fetchMuslimSalah(req.query.city);
    const today = moment().add(5, 'days').format('YYYY-MM-DD');
    const todayRamadanTimes = ramadanTimes.find((ramadanTime) => ramadanTime.dateTime === today);
    res.json(todayRamadanTimes);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});