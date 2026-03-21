import { reportsByCategoryData } from '../reports/reportsData'

export const reportsByCategory = reportsByCategoryData

export const reportsThisWeek = {
  title: 'Total Reports This Week',
  labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  values: [180, 60, 160, 120, 210, 150, 90],
}

export const dashboardStatCards = [
  {
    id: 'total-users',
    iconKey: 'users',
    label: 'Total Users',
    value: '75.8K',
    trendValue: '+12%',
    trendDirection: 'up',
    color: 'blue',
  },
  {
    id: 'ongoing-reports',
    iconKey: 'target',
    label: 'On going reports',
    value: '75.8K',
    trendValue: '-5%',
    trendDirection: 'down',
    color: 'purple',
  },
  {
    id: 'reports-resolved',
    iconKey: 'check-circle',
    label: 'Reports resolved',
    value: '75.8K',
    trendValue: '+8%',
    trendDirection: 'up',
    color: 'green',
  },
  {
    id: 'total-reports',
    iconKey: 'file-text',
    label: 'Total Reports',
    value: '75.8K',
    trendValue: '+3%',
    trendDirection: 'up',
    color: 'amber',
  },
]

export const dashboardAdminRows = [
  {
    name: 'Jiti Chazan',
    email: 'jitu@example.com',
    department: 'City Cooperative Development Office',
    activity: 'Today',
  },
  {
    name: 'Tiu Chapman',
    email: 'jitu@example.com',
    department: 'Finance, Revenue and Housing Office (DPO)',
    activity: 'Yesterday',
  },
  {
    name: 'Situ Chazan',
    email: 'jitu@example.com',
    department: 'Social, Deployment Service Office',
    activity: '3 March, 2026',
  },
  {
    name: 'Amanda Darrell',
    email: 'amanda@example.com',
    department: 'City Cooperative Office',
    activity: '3 March, 2026',
  },
  {
    name: 'Amanda Darrell',
    email: 'amanda@example.com',
    department: 'City Veterinary Office',
    activity: '3 March, 2026',
  },
]

export const dashboardAdminTableColumns = ['Name','Email', 'Department Assigned', 'Last Activity']
export const dashboardNewUsersTableColumns = ['Username', 'Date Joined']
