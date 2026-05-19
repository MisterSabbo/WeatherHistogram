function seededRandom(seed) {
  let s = seed
  return function () {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function generateMockForecast(pastDays = 7, forecastDays = 7) {
  const rand = seededRandom(42)
  const totalHours = (pastDays + forecastDays) * 24
  const now = new Date()
  const startDate = new Date(now.getTime() - pastDays * 86400000)
  startDate.setMinutes(0, 0, 0)

  const hourly = {
    time: [],
    temperature_2m: [],
    apparent_temperature: [],
    precipitation: [],
    precipitation_probability: [],
    cloudcover: [],
    wind_speed_10m: [],
    wind_gusts_10m: [],
    wind_direction_10m: [],
    weather_code: [],
    relative_humidity_2m: [],
    surface_pressure: [],
    uv_index: [],
    visibility: [],
    is_day: []
  }

  const daily = {
    time: [],
    sunrise: [],
    sunset: [],
    weather_code: [],
    temperature_2m_max: [],
    temperature_2m_min: [],
    precipitation_sum: [],
    wind_speed_10m_max: [],
    wind_gusts_10m_max: [],
    apparent_temperature_max: []
  }

  const dayStart = new Date(startDate)
  for (let d = 0; d < pastDays + forecastDays; d++) {
    const day = new Date(dayStart.getTime() + d * 86400000)
    day.setHours(0, 0, 0, 0)
    daily.time.push(Math.floor(day.getTime() / 1000))

    const sunrise = new Date(day)
    sunrise.setHours(6, 30, 0, 0)
    daily.sunrise.push(Math.floor(sunrise.getTime() / 1000))

    const sunset = new Date(day)
    sunset.setHours(18, 30 + Math.floor(d * 0.5), 0, 0)
    daily.sunset.push(Math.floor(sunset.getTime() / 1000))

    daily.weather_code.push(d % 3 === 0 ? 0 : d % 3 === 1 ? 3 : 61)
    daily.temperature_2m_max.push(28 + Math.sin(d * 0.3) * 6)
    daily.temperature_2m_min.push(15 + Math.sin(d * 0.3) * 4)
    daily.precipitation_sum.push(d % 4 === 0 ? 0 : rand() * 8)
    daily.wind_speed_10m_max.push(8 + rand() * 12)
    daily.wind_gusts_10m_max.push(12 + rand() * 20)
    daily.apparent_temperature_max.push(daily.temperature_2m_max[d] - 2)
  }

  for (let i = 0; i < totalHours; i++) {
    const t = new Date(startDate.getTime() + i * 3600000)
    hourly.time.push(Math.floor(t.getTime() / 1000))
    const hour = t.getHours()
    const isDay = hour >= 6 && hour < 20 ? 1 : 0
    hourly.is_day.push(isDay)
    hourly.temperature_2m.push(20 + Math.sin(i / 12 * Math.PI) * 8 + (rand() - 0.5) * 2)
    hourly.apparent_temperature.push(hourly.temperature_2m[i] - 2 + (rand() - 0.5) * 2)
    hourly.precipitation.push(i % 6 === 0 ? rand() * 3 : 0)
    hourly.precipitation_probability.push(i % 6 === 0 ? 30 + rand() * 50 : 0)
    hourly.cloudcover.push(20 + rand() * 60)
    hourly.wind_speed_10m.push(5 + rand() * 10)
    hourly.wind_gusts_10m.push(8 + rand() * 15)
    hourly.wind_direction_10m.push(rand() * 360)
    hourly.weather_code.push(isDay && i % 8 === 0 ? 61 : 0)
    hourly.relative_humidity_2m.push(40 + rand() * 40)
    hourly.surface_pressure.push(1013 + (rand() - 0.5) * 20)
    hourly.uv_index.push(isDay ? rand() * 8 : 0)
    hourly.visibility.push(8000 + rand() * 4000)
  }

  return { hourly, daily }
}

export function generateMockAQI(pastDays = 7, forecastDays = 7) {
  const rand = seededRandom(99)
  const totalHours = (pastDays + forecastDays) * 24
  const now = new Date()
  const startDate = new Date(now.getTime() - pastDays * 86400000)
  startDate.setMinutes(0, 0, 0)

  const hourly = {
    time: [],
    us_aqi: [],
    european_aqi: [],
    pm10: [],
    pm2_5: [],
    nitrogen_dioxide: [],
    ozone: [],
    alder_pollen: [],
    birch_pollen: [],
    grass_pollen: [],
    mugwort_pollen: [],
    olive_pollen: [],
    ragweed_pollen: []
  }

  for (let i = 0; i < totalHours; i++) {
    const t = new Date(startDate.getTime() + i * 3600000)
    hourly.time.push(Math.floor(t.getTime() / 1000))
    hourly.us_aqi.push(20 + rand() * 40)
    hourly.european_aqi.push(15 + rand() * 35)
    hourly.pm10.push(10 + rand() * 20)
    hourly.pm2_5.push(5 + rand() * 10)
    hourly.nitrogen_dioxide.push(3 + rand() * 8)
    hourly.ozone.push(30 + rand() * 30)
    hourly.alder_pollen.push(rand() * 50)
    hourly.birch_pollen.push(rand() * 80)
    hourly.grass_pollen.push(rand() * 30)
    hourly.mugwort_pollen.push(rand() * 20)
    hourly.olive_pollen.push(rand() * 40)
    hourly.ragweed_pollen.push(rand() * 60)
  }

  return { hourly }
}

export function setupMockRoutes(page) {
  const forecast = generateMockForecast()
  const aqi = generateMockAQI()

  return page.route('**/api.open-meteo.com/v1/forecast**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(forecast)
    })
  }).then(() =>
    page.route('**/air-quality-api.open-meteo.com/v1/air-quality**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(aqi)
      })
    })
  )
}
