const fetchBtn = document.getElementById("fetchBtn");
const symbolInput = document.getElementById("symbolInput");
const stockCard = document.getElementById("stockCard");
const loading = document.getElementById("loading");

fetchBtn.addEventListener("click", async () => {
  const symbol = symbolInput.value.trim().toUpperCase();
  if (!symbol) return alert("Please enter a stock symbol.");
  stockCard.classList.add("hidden");
  loading.classList.remove("hidden");

  try {
    const res = await fetch(`http://localhost:3000/api/stock/${symbol}`);
    const data = await res.json();
    if (!data || !data.c) throw new Error("No data found");

    const isPositive = data.d >= 0;
    stockCard.innerHTML = `
      <h2 class="text-lg font-semibold text-gray-100 mb-2">${symbol}</h2>
      <p class="text-3xl font-bold mb-1 ${isPositive ? 'text-green-400' : 'text-red-400'}">$${data.c.toFixed(2)}</p>
      <p class="text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}">
        ${isPositive ? '+' : ''}${data.d.toFixed(2)} (${data.dp.toFixed(2)}%)
      </p>
      <div class="text-gray-400 text-xs mt-3">
        <p>Open: $${data.o.toFixed(2)}</p>
        <p>High: $${data.h.toFixed(2)}</p>
        <p>Low: $${data.l.toFixed(2)}</p>
        <p>Prev Close: $${data.pc.toFixed(2)}</p>
      </div>
    `;
    stockCard.classList.remove("hidden");
  } catch (err) {
    alert("Unable to fetch stock data. Check symbol or server.");
    console.error(err);
  } finally {
    loading.classList.add("hidden");
  }
});
