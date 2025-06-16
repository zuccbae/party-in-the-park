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
    const workDate = document.getElementById('workDate').value;
    const hoursWorked = parseInt(document.getElementById('daysSpent').value, 10) || 0;
    const taskType = document.getElementById('taskType').value;
    const other = document.getElementById('otherDetails').value.trim();
    const timestamp = new Date().toISOString();

    const dateObj = new Date(workDate);
    const month = dateObj.toLocaleString('default', { month: 'long' });
    const year = dateObj.getFullYear();

    const entry = {
      Timestamp: timestamp,
      "First Name": firstName,
      "Last Name": lastName,
      "Date Worked": workDate,
      Month: month,
      Year: year,
      "Number of Hours Worked": hoursWorked,
      "Task Type": taskType,
      Other: other
    };

    // Cloud sync
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

    // Local save
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

    const csvHeader = "First Name,Last Name,Date Worked,Month,Year,Number of Hours Worked,Task Type,Other\n";
    const csvRows = weekEntries.map(entry =>
      `${entry["First Name"]},${entry["Last Name"]},${entry["Date Worked"]},${entry.Month},${entry.Year},${entry["Number of Hours Worked"]},${entry["Task Type"]},${entry.Other}`
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
    grouped = groupEntriesByMonth(entries);
    renderGroupedEntries(grouped);
    populateMonthDropdown(grouped);
  }

  function groupEntriesByMonth(entries) {
    const grouped = {};
    entries.forEach(entry => {
      const key = `${entry.Year}-${entry.Month}`;
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
        if (entry["Task Type"] === "Other" && entry.Other) {
          description += `: ${entry.Other}`;
        }
        const li = document.createElement('li');
        li.textContent = `${entry["First Name"]} ${entry["Last Name"]} – ${entry["Date Worked"]} – ${entry["Number of Hours Worked"]} hour(s) – ${description}`;
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
