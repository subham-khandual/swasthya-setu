import API_BASE_URL from '../../apiConfig';
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js';
import React, { useEffect, useState } from 'react';
import { Bar, Doughnut, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

function DrBloodDonation() {
  const [donations, setDonations] = useState([]);
  const [totals, setTotals] = useState({});
  const [totalDonors, setTotalDonors] = useState(0);

  // Fetch donation data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/blood/donations`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setDonations(data);

          // Calculate totals
          const bloodGroupTotals = {};
          data.forEach((donation) => {
            const { bloodType, quantity } = donation;
            if (!bloodGroupTotals[bloodType]) {
              bloodGroupTotals[bloodType] = { totalQuantity: 0, donorCount: 0 };
            }
            bloodGroupTotals[bloodType].totalQuantity += parseInt(quantity, 10);
            bloodGroupTotals[bloodType].donorCount += 1;
          });

          setTotals(bloodGroupTotals);
          setTotalDonors(data.length);
        } else {
          console.error('Failed to fetch donation data');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Prepare data for the pie chart
  const pieChartData = {
    labels: Object.keys(totals),
    datasets: [
      {
        label: 'Total Quantity (ml)',
        data: Object.values(totals).map((item) => item.totalQuantity),
        backgroundColor: [
          '#FF6384', // Red
          '#36A2EB', // Blue
          '#FFCE56', // Yellow
          '#4BC0C0', // Teal
          '#9966FF', // Purple
          '#FF9F40', // Orange
        ],
        hoverBackgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
        ],
      },
    ],
  };

  // Prepare data for the circle chart (Doughnut chart)
  const circleChartData = {
    labels: Object.keys(totals),
    datasets: [
      {
        label: 'Total Donors',
        data: Object.values(totals).map((item) => item.donorCount),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
        ],
        hoverBackgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
        ],
      },
    ],
  };

  // Prepare data for the bar graph (donations over time)
  const barChartData = {
    labels: donations.map((donation) => new Date(donation.date).toLocaleDateString()), // Extract dates
    datasets: [
      {
        label: 'Blood Donated (ml)',
        data: donations.map((donation) => donation.quantity), // Extract quantities
        backgroundColor: '#36A2EB', // Blue color for bars
        borderColor: '#36A2EB',
        borderWidth: 1,
      },
    ],
  };

  // Custom options for the charts to make them smaller and consistent
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Disable aspect ratio to control size
    plugins: {
      legend: {
        position: 'bottom', // Move legend to the bottom
        labels: {
          boxWidth: 10, // Smaller legend boxes
          font: {
            size: 10, // Smaller font size
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date', // X-axis label
        },
      },
      y: {
        title: {
          display: true,
          text: 'Quantity (ml)', // Y-axis label
        },
        beginAtZero: true, // Start Y-axis from 0
      },
    },
  };

  return (
    <div className="container" style={{ maxWidth: '90%', marginTop: '100px' }}>
      <h2 className="text-center mb-4" style={{ color: '#007bff' }}>
        Blood Donation Records
      </h2>

      {/* Table for donation records */}
      <div className="table-responsive mb-5">
        <table className="table table-hover table-striped table-bordered">
          <thead className="table-primary">
            <tr>
              <th>Blood Type</th>
              <th>Quantity (ml)</th>
              <th>Location</th>
              <th>Donor Name</th>
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
            {donations.map((donation) => (
              <tr key={donation._id}>
                <td>{donation.bloodType}</td>
                <td>{donation.quantity}</td>
                <td>{donation.location}</td>
                <td>{donation.name}</td>
                <td>{donation.contact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Statistics Section */}
      <h4 className="mt-5 mb-3" style={{ color: '#007bff' }}>Statistics</h4>
      <div className="mt-3">
        <p className="lead">
          <strong>Total Donors:</strong> {totalDonors}
        </p>

        {/* Charts Section */}
        <div className="row">
          {/* Pie Chart */}
          <div className="col-md-6 mb-5">
            <h5>Total Quantity by Blood Type (ml)</h5>
            <div style={{ width: '100%', height: '300px' }}> {/* Fixed size container */}
              <Pie data={pieChartData} options={chartOptions} />
            </div>
          </div>

          {/* Doughnut Chart */}
          <div className="col-md-6 mb-5">
            <h5>Total Donors by Blood Type</h5>
            <div style={{ width: '100%', height: '300px' }}> {/* Fixed size container */}
              <Doughnut data={circleChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Bar Graph Section */}
        <div className="mb-5">
          <h5>Blood Donations Over Time</h5>
          <div style={{ width: '100%', height: '300px' }}> {/* Fixed size container */}
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>

        {/* Table for blood type totals */}
        <div className="table-responsive">
          <table className="table table-hover table-striped table-bordered">
            <thead className="table-success">
              <tr>
                <th>Blood Type</th>
                <th>Total Quantity (ml)</th>
                <th>Total Donors</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(totals).map(([bloodType, { totalQuantity, donorCount }]) => (
                <tr key={bloodType}>
                  <td>{bloodType}</td>
                  <td>{totalQuantity}</td>
                  <td>{donorCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DrBloodDonation;
