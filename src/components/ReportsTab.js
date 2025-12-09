import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import '../styles/ReportsTab.css';

const ReportsTab = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    department: 'all',
    reportType: 'daily'
  });
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState(null);
  const [activeChart, setActiveChart] = useState('hourly');

  useEffect(() => {
    loadDepartments();
    generateReport();
  }, []);

  const loadDepartments = async () => {
    try {
      const depts = await adminService.getDepartments();
      setDepartments(depts);
    } catch (error) {
      console.error('Error loading departments:', error);
      setDepartments([]);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.generateReport(filters);
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Failed to generate report. Using sample data.');
      setReportData(getSampleReportData());
    } finally {
      setLoading(false);
    }
  };

  const getSampleReportData = () => {
    return {
      summary: {
        totalPatients: 156,
        servedPatients: 142,
        averageWaitTime: 18,
        averageServiceTime: 12,
        efficiency: 91
      },
      departmentStats: [
        { name: 'General OPD', served: 45, avgWait: 15, efficiency: 92 },
        { name: 'Cardiology', served: 28, avgWait: 25, efficiency: 85 },
        { name: 'Orthopedics', served: 32, avgWait: 20, efficiency: 88 },
        { name: 'Pediatrics', served: 22, avgWait: 10, efficiency: 95 },
        { name: 'Dental Care', served: 15, avgWait: 30, efficiency: 78 }
      ],
      hourlyDistribution: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: Math.floor(Math.random() * 20) + 5
      })),
      priorityBreakdown: [
        { priority: 'Normal', count: 120, percentage: 77 },
        { priority: 'Priority', count: 20, percentage: 13 },
        { priority: 'Emergency', count: 10, percentage: 6 },
        { priority: 'Senior', count: 4, percentage: 3 },
        { priority: 'Child', count: 2, percentage: 1 }
      ]
    };
  };

  const getSafeReportData = () => {
    if (!reportData) {
      return getSampleReportData();
    }
    return reportData;
  };

  const exportToCSV = () => {
    const data = getSafeReportData();
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hospital-report-${filters.startDate}-to-${filters.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    // PDF export implementation would go here
    alert('PDF export feature would be implemented here');
  };

  const convertToCSV = (data) => {
    const safeData = data || getSampleReportData();
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Patients', safeData.summary?.totalPatients || 0],
      ['Served Patients', safeData.summary?.servedPatients || 0],
      ['Average Wait Time', safeData.summary?.averageWaitTime || 0],
      ['Average Service Time', safeData.summary?.averageServiceTime || 0],
      ['Efficiency', safeData.summary?.efficiency || 0]
    ];
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const printReport = () => {
    window.print();
  };

  const safeData = getSafeReportData();

  return (
    <div className="reports-tab">
      {/* Header Section */}
      <div className="reports-header">
        <div className="header-content">
          <div className="header-title-section">
            <h1 className="page-title">Reports & Analytics</h1>
            <p className="page-subtitle">Comprehensive insights into hospital operations and patient flow</p>
          </div>
          <div className="header-info">
            <div className="report-period">
              <i className="fas fa-calendar"></i>
              {filters.startDate} to {filters.endDate}
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-warning">
            <i className="fas fa-exclamation-triangle"></i>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Filter Controls */}
      <div className="filter-section">
        <div className="filter-grid">
          <div className="filter-group">
            <label className="filter-label">Start Date</label>
            <input
              type="date"
              className="filter-input"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          <div className="filter-group">
            <label className="filter-label">End Date</label>
            <input
              type="date"
              className="filter-input"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
          <div className="filter-group">
            <label className="filter-label">Department</label>
            <select
              className="filter-select"
              value={filters.department}
              onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Report Type</label>
            <select
              className="filter-select"
              value={filters.reportType}
              onChange={(e) => setFilters(prev => ({ ...prev, reportType: e.target.value }))}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
        <div className="filter-actions">
          <button 
            className="btn btn-primary"
            onClick={generateReport}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Generating...
              </>
            ) : (
              <>
                <i className="fas fa-chart-bar"></i> Generate Report
              </>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
          <div className="loading-text">Generating comprehensive report...</div>
        </div>
      ) : (
        <div className="reports-content">
          {/* Key Metrics Overview */}
          <div className="metrics-overview">
            <div className="metric-card">
              <div className="metric-icon primary">
                <i className="fas fa-users"></i>
              </div>
              <div className="metric-content">
                <div className="metric-value">{safeData.summary?.totalPatients || 0}</div>
                <div className="metric-label">Total Patients</div>
                <div className="metric-trend positive">
                  <i className="fas fa-arrow-up"></i>
                  12% from last period
                </div>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon success">
                <i className="fas fa-user-check"></i>
              </div>
              <div className="metric-content">
                <div className="metric-value">{safeData.summary?.servedPatients || 0}</div>
                <div className="metric-label">Served Patients</div>
                <div className="metric-trend positive">
                  <i className="fas fa-arrow-up"></i>
                  8% from last period
                </div>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon warning">
                <i className="fas fa-clock"></i>
              </div>
              <div className="metric-content">
                <div className="metric-value">{safeData.summary?.averageWaitTime || 0}m</div>
                <div className="metric-label">Avg Wait Time</div>
                <div className="metric-trend negative">
                  <i className="fas fa-arrow-down"></i>
                  5% improvement
                </div>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-card">
                <div className="metric-icon info">
                  <i className="fas fa-chart-line"></i>
                </div>
                <div className="metric-content">
                  <div className="metric-value">{safeData.summary?.efficiency || 0}%</div>
                  <div className="metric-label">Efficiency Rate</div>
                  <div className="metric-trend positive">
                    <i className="fas fa-arrow-up"></i>
                    3% improvement
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-section">
            <div className="section-header">
              <h3>Performance Analytics</h3>
              <div className="chart-controls">
                <button 
                  className={`chart-toggle ${activeChart === 'hourly' ? 'active' : ''}`}
                  onClick={() => setActiveChart('hourly')}
                >
                  Hourly Flow
                </button>
                <button 
                  className={`chart-toggle ${activeChart === 'priority' ? 'active' : ''}`}
                  onClick={() => setActiveChart('priority')}
                >
                  Priority Distribution
                </button>
              </div>
            </div>

            <div className="charts-grid">
              <div className="chart-container">
                <div className="chart-header">
                  <h4>Patient Flow by Hour</h4>
                  <div className="chart-legend">
                    <div className="legend-item">
                      <span className="legend-color primary"></span>
                      Patient Volume
                    </div>
                  </div>
                </div>
                <div className="bar-chart">
                  {(safeData.hourlyDistribution || Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }))).map((hourData, index) => (
                    <div key={index} className="bar-group">
                      <div className="bar-wrapper">
                        <div 
                          className="bar"
                          style={{ height: `${((hourData.count || 0) / 25) * 100}%` }}
                          title={`${hourData.count || 0} patients at ${hourData.hour}:00`}
                        >
                          <div className="bar-value">{hourData.count || 0}</div>
                        </div>
                      </div>
                      <div className="bar-label">{hourData.hour}:00</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-container">
                <div className="chart-header">
                  <h4>Priority Distribution</h4>
                  <div className="chart-legend">
                    {(safeData.priorityBreakdown || []).map((item, index) => (
                      <div key={index} className="legend-item">
                        <span 
                          className="legend-color"
                          style={{ backgroundColor: getPriorityColor(item.priority) }}
                        ></span>
                        {item.priority}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pie-chart-container">
                  <div className="pie-chart">
                    {(safeData.priorityBreakdown || []).map((item, index) => (
                      <div key={index} className="pie-segment-container">
                        <div 
                          className="pie-segment"
                          style={{ 
                            backgroundColor: getPriorityColor(item.priority),
                            transform: `rotate(${getRotationAngle(index, safeData.priorityBreakdown || [])}deg)`,
                            clipPath: getClipPath(item.percentage || 0, index, safeData.priorityBreakdown || [])
                          }}
                        ></div>
                      </div>
                    ))}
                    <div className="pie-center">
                      <div className="pie-total">
                        {safeData.priorityBreakdown?.reduce((sum, item) => sum + (item.count || 0), 0) || 0}
                      </div>
                      <div className="pie-label">Total</div>
                    </div>
                  </div>
                  <div className="pie-labels">
                    {(safeData.priorityBreakdown || []).map((item, index) => (
                      <div key={index} className="pie-label-item">
                        <span 
                          className="label-color"
                          style={{ backgroundColor: getPriorityColor(item.priority) }}
                        ></span>
                        <div className="label-text">
                          <span className="label-name">{item.priority}</span>
                          <span className="label-value">{item.percentage || 0}% ({item.count || 0})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Department Performance */}
          <div className="performance-section">
            <div className="section-header">
              <h3>Department Performance</h3>
              <div className="section-actions">
                <button className="btn btn-outline">
                  <i className="fas fa-sort"></i> Sort
                </button>
              </div>
            </div>
            <div className="performance-table">
              <div className="table-header">
                <div className="table-col department">Department</div>
                <div className="table-col served">Patients Served</div>
                <div className="table-col wait-time">Avg Wait Time</div>
                <div className="table-col efficiency">Efficiency</div>
                <div className="table-col trend">Trend</div>
              </div>
              <div className="table-body">
                {(safeData.departmentStats || []).map((dept, index) => (
                  <div key={index} className="table-row">
                    <div className="table-col department">
                      <div className="dept-info">
                        <div className="dept-name">{dept.name || 'Unknown Department'}</div>
                        <div className="dept-type">Medical Department</div>
                      </div>
                    </div>
                    <div className="table-col served">
                      <div className="value-highlight">{dept.served || 0}</div>
                      <div className="value-subtext">patients</div>
                    </div>
                    <div className="table-col wait-time">
                      <div className={`time-indicator ${(dept.avgWait || 0) > 20 ? 'high' : 'low'}`}>
                        {dept.avgWait || 0}m
                      </div>
                    </div>
                    <div className="table-col efficiency">
                      <div className="efficiency-display">
                        <div className="efficiency-bar">
                          <div 
                            className="efficiency-progress"
                            style={{ width: `${dept.efficiency || 0}%` }}
                            data-efficiency={dept.efficiency || 0}
                          ></div>
                        </div>
                        <span className="efficiency-value">{dept.efficiency || 0}%</span>
                      </div>
                    </div>
                    <div className="table-col trend">
                      <div className={`trend-indicator ${index % 3 === 0 ? 'up' : index % 3 === 1 ? 'down' : 'stable'}`}>
                        {index % 3 === 0 ? (
                          <><i className="fas fa-arrow-up"></i> 5.2%</>
                        ) : index % 3 === 1 ? (
                          <><i className="fas fa-arrow-down"></i> 2.1%</>
                        ) : (
                          <><i className="fas fa-minus"></i> 0.3%</>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {(!safeData.departmentStats || safeData.departmentStats.length === 0) && (
                  <div className="empty-state">
                    <i className="fas fa-chart-bar"></i>
                    <div>No department performance data available</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Export Actions */}
          <div className="export-section">
            <div className="export-header">
              <h4>Export Report</h4>
              <p>Download your report in various formats for further analysis</p>
            </div>
            <div className="export-actions">
              <button className="btn btn-success" onClick={exportToCSV}>
                <i className="fas fa-file-csv"></i> Export CSV
              </button>
              <button className="btn btn-primary" onClick={exportToPDF}>
                <i className="fas fa-file-pdf"></i> Export PDF
              </button>
              <button className="btn btn-outline" onClick={printReport}>
                <i className="fas fa-print"></i> Print Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
const getPriorityColor = (priority) => {
  if (!priority) return '#2ecc71';
  
  switch (priority.toLowerCase()) {
    case 'emergency': return '#e74c3c';
    case 'priority': return '#f39c12';
    case 'senior': return '#9b59b6';
    case 'child': return '#3498db';
    default: return '#2ecc71';
  }
};

const getRotationAngle = (index, data) => {
  if (!data || data.length === 0) return 0;
  
  let previousPercentages = 0;
  for (let i = 0; i < index; i++) {
    previousPercentages += data[i]?.percentage || 0;
  }
  return (previousPercentages / 100) * 360;
};

const getClipPath = (percentage, index, data) => {
  if (!data || data.length === 0) return 'circle(50% at 50% 50%)';
  
  let startAngle = 0;
  for (let i = 0; i < index; i++) {
    startAngle += data[i]?.percentage || 0;
  }
  const endAngle = startAngle + (percentage || 0);
  
  if (percentage === 100) return 'circle(50% at 50% 50%)';
  
  const startX = 50 + 50 * Math.cos((startAngle * 3.6 - 90) * (Math.PI / 180));
  const startY = 50 + 50 * Math.sin((startAngle * 3.6 - 90) * (Math.PI / 180));
  const endX = 50 + 50 * Math.cos((endAngle * 3.6 - 90) * (Math.PI / 180));
  const endY = 50 + 50 * Math.sin((endAngle * 3.6 - 90) * (Math.PI / 180));
  
  const largeArcFlag = percentage > 50 ? 1 : 0;
  
  return `path('M 50 50 L ${startX} ${startY} A 50 50 0 ${largeArcFlag} 1 ${endX} ${endY} Z')`;
};

export default ReportsTab;