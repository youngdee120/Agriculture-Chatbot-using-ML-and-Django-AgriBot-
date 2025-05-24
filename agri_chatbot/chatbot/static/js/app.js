document.addEventListener('DOMContentLoaded', () => {
  let chart, map, marker;
  const API_KEY = 'd1845658f92b31c64bd94f06f7188c9c';
const weatherIcons = {
    0: "☀️",   // Clear sky
    1: "🌤️",  // Mainly clear
    2: "⛅",   // Partly cloudy
    3: "☁️",   // Overcast
    45: "🌫️",  // Fog
    48: "🌁",   // Depositing rime fog
    51: "🌦️",  // Light drizzle
    53: "🌦️",  // Moderate drizzle
    55: "🌧️",  // Dense drizzle
    56: "🌧️",  // Freezing drizzle
    57: "🌧️",  // Dense freezing drizzle
    61: "🌧️",  // Slight rain
    63: "🌧️",  // Moderate rain
    65: "🌧️",  // Heavy rain
    66: "🌧️",  // Freezing rain
    67: "🌧️",  // Heavy freezing rain
    71: "🌨️",  // Slight snow fall
    73: "🌨️",  // Moderate snow fall
    75: "❄️",   // Heavy snow fall
    77: "❄️",   // Snow grains
    80: "🌦️",  // Rain showers
    81: "🌧️",  // Moderate rain showers
    82: "🌧️",  // Violent rain showers
    85: "❄️",   // Slight snow showers
    86: "❄️",   // Heavy snow showers
    95: "⛈️",   // Thunderstorm
    96: "⛈️",   // Thunderstorm with slight hail
    99: "🌩️"    // Thunderstorm with heavy hail
  };

  const grantBtn  = document.getElementById('grantBtn');
  const searchBtn = document.getElementById('searchBtn');
  const msgEl     = document.getElementById('message');
  const loadEl    = document.getElementById('loading');
  const infoEl    = document.getElementById('info');
  const cropEl    = document.getElementById('cropText');
  const chartCtx  = document.getElementById('weatherChart').getContext('2d');

  const show = el => el.style.display = '';
  const hide = el => el.style.display = 'none';
  const showMsg = txt => (msgEl.textContent = txt, show(msgEl));

  function initMap(lat=0,lon=0){
    if(!map){
      const normal = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { attribution:'© OSM' }
      );
      const sat = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution:'Esri' }
      );
      map = L.map('map',{center:[lat,lon],zoom:8,layers:[normal]});
      L.control.layers({'Normal':normal,'Satellite':sat}).addTo(map);
      marker = L.marker([lat,lon]).addTo(map);
    } else {
      map.setView([lat,lon],8);
      marker.setLatLng([lat,lon]);
    }
  }

  function recCrop(name){
    name=name.toLowerCase();
    if(name.includes('nairobi')) return 'Maize, Vegetables';
    if(name.includes('mombasa')) return 'Bananas, Coconut';
    if(name.includes('kisumu')) return 'Rice, Sugarcane';
    return 'Maize, Beans, Tomatoes';
  }

  async function fetchCurrent(q){
    const url = typeof q=='string'
      ? `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&units=metric&appid=${API_KEY}`
      : `https://api.openweathermap.org/data/2.5/weather?lat=${q.lat}&lon=${q.lon}&units=metric&appid=${API_KEY}`;
    const r = await fetch(url);
    if(!r.ok) throw new Error('Weather fetch error');
    return r.json();
  }
  async function fetchTrend(lat,lon){
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`+
      `&daily=temperature_2m_max,weathercode&past_days=7&forecast_days=7&timezone=auto`;
    const r=await fetch(url);
    if(!r.ok) throw new Error('Trend fetch error');
    return r.json();
  }

  function plotTrend(data){
    const dates = data.daily.time;
    const temps = data.daily.temperature_2m_max;
    const codes = data.daily.weathercode;
    const humidities = data.daily.relativehumidity_2m || [];
    const windspeeds = data.daily.windspeed_10m_max || [];
  
    const icons = codes.map(c => weatherIcons[c] || '❓');
  
    const grad = chartCtx.createLinearGradient(0, 0, 0, 200);
    grad.addColorStop(0, 'rgba(139,195,74,0.4)');
    grad.addColorStop(1, 'rgba(139,195,74,0)');
  
    if(chart) chart.destroy();
  
    chart = new Chart(chartCtx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Temperature (°C)',
          data: temps,
          fill: true,
          backgroundColor: grad,
          borderColor: '#2e7d32',
          tension: 0.2,
          pointRadius: 16,
          pointHoverRadius: 20
        }]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: function(ctx) {
                const index = ctx.dataIndex;
                const temp = temps[index];
                const hum = humidities[index] || 'N/A';
                const wind = windspeeds[index] || 'N/A';
                const icon = icons[index];
                return [
                  ` ${icon} Weather Info`,
                  ` Temp: ${temp}°C`,
                  ` Humidity: ${hum}%`,
                  ` Wind: ${wind} km/h`
                ];
              }
            },
            bodyFont: {
              size: 16
            },
            titleFont: {
              size: 18
            }
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              font: {
                size: 16
              }
            }
          },
          x: {
            ticks: {
              font: {
                size: 14
              }
            }
          }
        }
      },
      plugins: [{
        id: 'emojiPoints',
        afterDatasetsDraw(chart) {
          const ctx = chart.ctx;
          ctx.save();
          chart.getDatasetMeta(0).data.forEach((point, i) => {
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(icons[i], point.x, point.y);
          });
          ctx.restore();
        }
      }]
    });
  }
  

  async function updateAll(param){
    hide(msgEl); hide(infoEl); show(loadEl);
    try{
      const cur   = await fetchCurrent(param);
      document.getElementById('cityName').textContent    = cur.name;
      document.getElementById('countryIcon').src         =
        `https://flagcdn.com/144x108/${cur.sys.country.toLowerCase()}.png`;
      document.getElementById('weatherDesc').textContent = cur.weather[0].description;
      document.getElementById('temp').textContent        = cur.main.temp+' °C';
      document.getElementById('windspeed').textContent   = cur.wind.speed+' m/s';
      document.getElementById('humidity').textContent    = cur.main.humidity+'%';
      document.getElementById('cloudiness').textContent  = cur.clouds.all+'%';
      cropEl.textContent = recCrop(cur.name);
      initMap(cur.coord.lat,cur.coord.lon);
      const trend = await fetchTrend(cur.coord.lat,cur.coord.lon);
      plotTrend(trend);
      hide(loadEl); show(infoEl);
    } catch(e){
      hide(loadEl); showMsg(e.message);
    }
  }

  grantBtn.addEventListener('click', ()=>{
    if(!navigator.geolocation) return showMsg('Geolocation unsupported');
    navigator.geolocation.getCurrentPosition(
      pos=>updateAll({lat:pos.coords.latitude,lon:pos.coords.longitude}),
      ()=>showMsg('Permission denied')
    );
  });
  searchBtn.addEventListener('click', ()=>{
    const c = document.getElementById('cityInput').value.trim();
    if(!c) return showMsg('Enter city');
    updateAll(c);
  });

  initMap();
});








// create the Chart.js instance
const ctx = document.getElementById('liveTrendChart').getContext('2d');
const liveChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: Array.from({length: 15}, (_, i) => `Day ${i+1}`),
    datasets: [{
      label: 'Soil Moisture Trend',
      data: Array(15).fill().map(() => Math.random() * 100),
      fill: false,
      tension: 0.3,
    }]
  },
  options: {
    animation: {
      duration: 2000,
      easing: 'easeOutQuart'
    },
    scales: {
      y: { beginAtZero: true }
    }
  }
});

// only play animation when scrolled into view
function onVisibility(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      liveChart.update();
      observer.disconnect();
    }
  });
}

const observer = new IntersectionObserver(onVisibility, { threshold: 0.5 });
observer.observe(document.getElementById('liveTrendChart'));


