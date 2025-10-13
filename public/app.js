// app.js — frontend script
document.addEventListener("DOMContentLoaded", () => {
  const fetchBtn = document.getElementById("fetchBtn");
  const symbolInput = document.getElementById("symbolInput");
  const stockCard = document.getElementById("stockCard");
  const loading = document.getElementById("loading");
  const priceChartCanvas = document.getElementById("priceChart");

  let chart;

  fetchBtn.addEventListener("click", async () => {
    const symbol = symbolInput.value.trim().toUpperCase();
    if (!symbol) return alert("Please enter a stock symbol.");

    stockCard.classList.add("hidden");
    loading.classList.remove("hidden");

    try {
      // Parallel fetch: quote, company, candle
      const [quoteRes, companyRes, candleRes] = await Promise.all([
        fetch(`http://localhost:3000/api/stock/${symbol}`),
        fetch(`http://localhost:3000/api/company/${symbol}`),
        fetch(`http://localhost:3000/api/candle/${symbol}`)
      ]);

      const quote = await quoteRes.json();
      const company = await companyRes.json();
      const candleData = await candleRes.json();

      if (!quote || typeof quote.c !== "number") {
        throw new Error("Quote not available");
      }

      const profile = company.profile || {};
      const metrics = company.metrics || {};

      // Render overview & company info
      const isPositive = quote.d >= 0;
      stockCard.innerHTML = `
        <div class="flex items-center mb-4">
          ${profile.logo ? `<img src="${profile.logo}" class="w-10 h-10 rounded-full mr-3" />` : ""}
          <div>
            <h2 class="text-xl font-semibold text-gray-100">${profile.name ? profile.name : symbol} <span class="text-sm text-gray-400">(${symbol})</span></h2>
            <p class="text-sm text-gray-400">${profile.exchange || ""} ${profile.finnhubIndustry ? "• " + profile.finnhubIndustry : ""}</p>
          </div>
        </div>

        <p class="text-4xl font-bold mb-2 ${isPositive ? 'text-green-400' : 'text-red-400'}">
          $${quote.c.toFixed(2)}
        </p>
        <p class="${isPositive ? 'text-green-400' : 'text-red-400'} text-sm mb-3">
          ${isPositive ? '+' : ''}${quote.d.toFixed(2)} (${quote.dp.toFixed(2)}%)
        </p>

        <div class="grid grid-cols-2 gap-2 text-sm text-gray-300 mb-4">
          <p>Open: $${quote.o.toFixed(2)}</p>
          <p>High: $${quote.h.toFixed(2)}</p>
          <p>Low: $${quote.l.toFixed(2)}</p>
          <p>Prev Close: $${quote.pc.toFixed(2)}</p>
        </div>

        <hr class="my-3 border-gray-700" />

        <div class="text-sm text-gray-300">
          <h3 class="text-teal-400 font-semibold mb-2">Key Metrics</h3>
          <div class="grid grid-cols-2 gap-2">
            <p>Market Cap: ${metrics.marketCapitalization ? ('$' + Number(metrics.marketCapitalization).toLocaleString()) : 'N/A'}</p>
            <p>P/E (normalized): ${metrics.peNormalizedAnnual ?? 'N/A'}</p>
            <p>EPS (normalized): ${metrics.epsNormalizedAnnual ?? 'N/A'}</p>
            <p>Dividend Yield: ${metrics.dividendYieldIndicatedAnnual ? (Number(metrics.dividendYieldIndicatedAnnual).toFixed(2) + '%') : 'N/A'}</p>
          </div>
        </div>
      `;

      stockCard.classList.remove("hidden");

      // --- Chart: last 7 trading days ---
      if (candleData && candleData.s === "ok" && candleData.t.length && candleData.c.length) {
        const labels = candleData.t.map(ts => new Date(ts * 1000).toLocaleDateString());
        const prices = candleData.c;

        if (chart) chart.destroy();

        chart = new Chart(priceChartCanvas, {
          type: "line",
          data: {
            labels,
            datasets: [{
              label: `${symbol} — Last 7 Trading Days`,
              data: prices,
              borderColor: "#00C896",
              backgroundColor: "rgba(0,200,150,0.08)",
              tension: 0.25,
              pointRadius: 3,
              fill: true
            }]
          },
          options: {
            responsive: true,
            scales: {
              x: { ticks: { color: "#9CA3AF" } },
              y: { ticks: { color: "#9CA3AF" } }
            },
            plugins: { legend: { labels: { color: "#E5E7EB" } } }
          }
        });
      } else {
        if (chart) { chart.destroy(); chart = null; }
        console.warn("No candle data available to draw chart.");
      }


    } catch (err) {
      console.error("Fetch/Render error:", err);
      alert("Unable to fetch stock/company data. Check symbol or server logs.");
    } finally {
      loading.classList.add("hidden");
    }
  });

  // Optional: allow Enter key in input to trigger fetch
  symbolInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") fetchBtn.click();
  });
});
