document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('logForm');
  const downloadBtn = document.getElementById('downloadCSV');
  const weekSelect = document.getElementById('weekSelect');
  const weeklyContainer = document.getElementById('weeklyEntriesContainer');
  const weekDisplay = document.getElementById('currentWeekDisplay');

  let entries = JSON.parse(localStorage.getItem('volunteerEntries')) || [];
  let grouped = {};

  refreshView();

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const month = document.getElementById('month').value;
    const year = document.getElementById('year').value;
    const daysSpent = parseFloat(document.getElementById('daysSpent').value) || 0;
    const taskType = document.getElementById('taskType').value;
    const other = document.getElementById('otherDetails').value.trim();
    const timestamp = new Date().toISOString();

    const entry = {
      Timestamp: timestamp,
      "First Name": firstName,
      "Last Name": lastName,
      Month: month,
      Year: year,
      "Number of Days Spent": daysSpent,
      "Task Type": taskType,
      Other: other
    };

    fetch('https://sheetdb.io/api/v1/c32du5n38t9gc', {
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

    entries.push(entry);
    localStorage.setItem('volunteerEntries', JSON.stringify(entries));
    refreshView();
    form.reset();
  });

  downloadBtn.addEventListener('click', () => {
    const selectedWeek = weekSelect.value;
    if (!selectedWeek) {
      alert("Please select a month to download.");
      return;
    }

    const weekEntries = grouped[selectedWeek];
    if (!weekEntries?.length) {
      alert("No entries for selected month.");
      return;
    }

    const csvHeader = "First Name,Last Name,Month,Year,Number of Days Spent,Task Type,Other\n";
    const csvRows = weekEntries.map(entry =>
      `${entry["First Name"]},${entry["Last Name"]},${entry.Month},${entry.Year},${entry["Number of Days Spent"]},${entry["Task Type"]},${entry.Other}`
    );
    const csvContent = csvHeader + csvRows.join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `volunteer_log_${selectedWeek}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  function refreshView() {
    grouped = groupEntriesByWeek(entries);
    renderGroupedEntries(grouped);
    populateWeekDropdown(grouped);
  }

  function getWeekNumber(date = new Date()) {
    // Retained for naming compatibility
    return '';
  }

  function groupEntriesByWeek(entries) {
    const grouped = {};
    entries.forEach(entry => {
      const month = entry.Month || "January";
      const year = entry.Year || new Date().getFullYear();
      const key = `${year}-${month}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(entry);
    });
    return grouped;
  }

  function renderGroupedEntries(grouped) {
    weeklyContainer.innerHTML = '';
    for (const week in grouped) {
      const section = document.createElement('div');
      section.innerHTML = `<h3>${week}</h3>`;
      const ul = document.createElement('ul');
      grouped[week].forEach(entry => {
        let description = `${entry["Task Type"]}`;
        if (entry["Task Type"] === "Other" && entry.Other) {
          description += `: ${entry.Other}`;
        }
        const li = document.createElement('li');
        li.textContent = `${entry["First Name"]} ${entry["Last Name"]} – ${entry.Month} ${entry.Year} – ${entry["Number of Days Spent"]} day(s) – ${description}`;
        ul.appendChild(li);
      });
      section.appendChild(ul);
      weeklyContainer.appendChild(section);
    }
  }

  function populateWeekDropdown(grouped) {
    weekSelect.innerHTML = `<option value="">Select a month</option>`;
    Object.keys(grouped).forEach(week => {
      const option = document.createElement('option');
      option.value = week;
      option.textContent = week;
      weekSelect.appendChild(option);
    });
  }

  function displayCurrentWeekLabel() {
    if (!weekDisplay) return;

    const today = new Date();
    const week = getWeekNumber(today);
    const monday = new Date(today);
    monday.setDate(monday.getDate() - ((today.getDay() + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const format = (date) => date.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });

    const range = `${format(monday)} – ${format(sunday)}`;
    weekDisplay.textContent = `Logging entries for: ${week} (${range})`;
  }
});
