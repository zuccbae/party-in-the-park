document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('logForm');
  const downloadBtn = document.getElementById('downloadCSV');
  const weekSelect = document.getElementById('weekSelect');
  const weeklyContainer = document.getElementById('weeklyEntriesContainer');

  let entries = JSON.parse(localStorage.getItem('volunteerEntries')) || [];

  // 🧼 Clean out broken entries
  entries = entries.filter(e => e["Day Worked"] && e["Day Worked"] !== "undefined");
  localStorage.setItem('volunteerEntries', JSON.stringify(entries));

  let grouped = {};

  refreshView();

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // ✅ Check for required fields
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const workDate = document.getElementById('workDate').value;
    const hoursWorked = parseInt(document.getElementById('daysSpent').value, 10) || 0;
    const taskType = document.getElementById('taskType').value;
    const other = document.getElementById('otherDetails').value.trim();
    const timestamp = new Date().toISOString();

    // ⛔ Check for invalid date
    if (!workDate) {
      alert("Please select a valid date.");
      return;
    }

    const dateObj = new Date(workDate);
    if (isNaN(dateObj)) {
      alert("Invalid date format.");
      return;
    }

    const month = dateObj.toLocaleString('default', { month: 'long' });
    const year = dateObj.getFullYear();
    const groupKey = `${year}-${month}`;

    const entry = {
      "First Name": firstName,
      "Last Name": lastName,
      "Day Worked": workDate,
      "Number of Hours Worked": hoursWorked,
      "Task Type": taskType,
      "Other": other,
      "Timestamp": timestamp,
      groupKey
    };

    // 🌐 Send to SheetDB
    fetch('https://sheetdb.io/api/v1/qfiimhz27242h', {
      method: 'POST',
      body: JSON.stringify({ data: entry }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(res => res.json())
    .then(() => {
      alert('Entry submitted successfully to cloud!');
    })
    .catch(err => {
      console.error('Cloud submission error:', err);
      alert('Cloud error – entry saved locally instead.');
    });

    // 💾 Local save
    entries.push(entry);
    localStorage.setItem('volunteerEntries', JSON.stringify(entries));
    refreshView();
    form.reset();
  });

  downloadBtn.addEventListener('click', () => {
    const selectedMonth = weekSelect.value;
    if (!selectedMonth) {
      alert("Please select a month to download.");
      return;
    }

    const monthEntries = grouped[selectedMonth];
    if (!monthEntries?.length) {
      alert("No entries for selected month.");
      return;
    }

    const csvHeader = "First Name,Last Name,Day Worked,Number of Hours Worked,Task Type,Other,Timestamp\n";
    const csvRows = monthEntries.map(entry =>
      `${entry["First Name"]},${entry["Last Name"]},${entry["Day Worked"]},${entry["Number of Hours Worked"]},${entry["Task Type"]},${entry["Other"]},${entry["Timestamp"]}`
    );
    const csvContent = csvHeader + csvRows.join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `volunteer_log_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  function refreshView() {
    grouped = groupEntriesByMonth(entries);
    renderGroupedEntries(grouped);
    populateMonthDropdown(grouped);
  }

  function groupEntriesByMonth(entries) {
    const grouped = {};
    entries.forEach(entry => {
      const key = entry.groupKey || "Unknown";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(entry);
    });
    return grouped;
  }

  function renderGroupedEntries(grouped) {
    weeklyContainer.innerHTML = '';
    for (const key in grouped) {
      const section = document.createElement('div');
      section.innerHTML = `<h3>${key}</h3>`;
      const ul = document.createElement('ul');
      grouped[key].forEach(entry => {
        let description = `${entry["Task Type"]}`;
        if (entry["Task Type"] === "Other" && entry["Other"]) {
          description += `: ${entry["Other"]}`;
        }
        const li = document.createElement('li');
        li.textContent = `${entry["First Name"]} ${entry["Last Name"]} – ${entry["Day Worked"]} – ${entry["Number of Hours Worked"]} hour(s) – ${description}`;
        ul.appendChild(li);
      });
      section.appendChild(ul);
      weeklyContainer.appendChild(section);
    }
  }

  function populateMonthDropdown(grouped) {
    weekSelect.innerHTML = `<option value="">Select a month</option>`;
    Object.keys(grouped).forEach(key => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = key;
      weekSelect.appendChild(option);
    });
  }
});
