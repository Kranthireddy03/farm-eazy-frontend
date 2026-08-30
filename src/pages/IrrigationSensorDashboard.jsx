import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import AppPage from '../components/layout/AppPage'
import { PageScaffold } from '../components/app/PageScaffold'
import { PageSkeleton } from '../components/ui/Skeleton'
import { IrrigationPageAside } from '../components/irrigation/IrrigationPageAside'
import { buttonVariants } from '../components/ui/button'
import { cn } from '../lib/utils'
import apiClient from '../services/apiClient'
import { unwrapApiList } from '../utils/apiResponse'

const SENSOR_TYPES = {
  SOIL_MOISTURE: { label: 'Soil Moisture', icon: '💧', unit: '%', color: 'blue' },
  TEMPERATURE: { label: 'Temperature', icon: '🌡️', unit: '°C', color: 'orange' },
  HUMIDITY: { label: 'Humidity', icon: '💨', unit: '%', color: 'cyan' },
  LIGHT_INTENSITY: { label: 'Light', icon: '☀️', unit: 'lux', color: 'yellow' },
  SOIL_PH: { label: 'Soil pH', icon: '🧪', unit: 'pH', color: 'purple' },
  WATER_LEVEL: { label: 'Water Level', icon: '🌊', unit: 'cm', color: 'teal' }
}

const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  INACTIVE: 'bg-muted text-foreground dark:bg-muted/30 dark:text-muted-foreground',
  ERROR: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
}

function IrrigationSensorDashboard() {
  const { isDark } = useTheme()
  const [sensors, setSensors] = useState([])
  const [rules, setRules] = useState([])
  const [selectedFarm, setSelectedFarm] = useState('')
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRuleForm, setShowRuleForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [ruleForm, setRuleForm] = useState({
    sensorType: 'SOIL_MOISTURE',
    conditionType: 'BELOW',
    thresholdValue: '',
    action: 'TURN_ON_IRRIGATION',
    isActive: true
  })

  useEffect(() => {
    fetchFarms()
  }, [])

  useEffect(() => {
    if (selectedFarm) {
      fetchSensorData()
      fetchRules()
    }
  }, [selectedFarm])

  const fetchFarms = async () => {
    try {
      const response = await apiClient.get('/farms')
      const farmList = unwrapApiList(response?.data)
      setFarms(farmList)
      if (farmList.length > 0) {
        setSelectedFarm(farmList[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch farms:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSensorData = async () => {
    try {
      const response = await apiClient.get(`/irrigation-sensors/farm/${selectedFarm}/latest`)
      setSensors(response.data || [])
    } catch (error) {
      console.error('Failed to fetch sensor data:', error)
      setSensors([])
    }
  }

  const fetchRules = async () => {
    try {
      const response = await apiClient.get(`/irrigation-sensors/farm/${selectedFarm}/rules`)
      setRules(response.data || [])
    } catch (error) {
      console.error('Failed to fetch rules:', error)
      setRules([])
    }
  }

  const handleCreateRule = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage({ type: '', text: '' })

    try {
      await apiClient.post(`/irrigation-sensors/farm/${selectedFarm}/rules`, {
        ...ruleForm,
        thresholdValue: parseFloat(ruleForm.thresholdValue)
      })
      
      setMessage({ type: 'success', text: 'Automation rule created successfully!' })
      setShowRuleForm(false)
      setRuleForm({
        sensorType: 'SOIL_MOISTURE',
        conditionType: 'BELOW',
        thresholdValue: '',
        action: 'TURN_ON_IRRIGATION',
        isActive: true
      })
      fetchRules()
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to create rule' 
      })
    } finally {
      setSubmitting(false)
    }
  }

  const toggleRuleStatus = async (ruleId, currentStatus) => {
    try {
      await apiClient.patch(`/irrigation-sensors/rules/${ruleId}`, {
        isActive: !currentStatus
      })
      fetchRules()
    } catch (error) {
      console.error('Failed to toggle rule:', error)
    }
  }

  const deleteRule = async (ruleId) => {
    if (!confirm('Are you sure you want to delete this rule?')) return
    
    try {
      await apiClient.delete(`/irrigation-sensors/rules/${ruleId}`)
      setMessage({ type: 'success', text: 'Rule deleted successfully' })
      fetchRules()
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete rule' })
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSensorColor = (type, value) => {
    const config = SENSOR_TYPES[type]
    if (!config) return 'gray'
    
    // Simple threshold-based coloring
    if (type === 'SOIL_MOISTURE') {
      if (value < 30) return 'red'
      if (value < 50) return 'yellow'
      return 'green'
    }
    if (type === 'TEMPERATURE') {
      if (value > 40 || value < 10) return 'red'
      if (value > 35 || value < 15) return 'yellow'
      return 'green'
    }
    return config.color
  }

  if (loading) {
    return (
      <AppPage title="Irrigation sensors" description="Monitor farm conditions and automation rules.">
        <PageSkeleton rows={5} />
      </AppPage>
    )
  }

  if (farms.length === 0) {
    return (
      <AppPage title="Irrigation sensors" description="Monitor farm conditions and automation rules.">
        <div className="text-center py-12 rounded-lg border border-dashed border-border">
          <p className="text-muted-foreground mb-4">Add a farm before setting up sensors.</p>
          <Link to="/farms" className={cn(buttonVariants())}>Create farm</Link>
        </div>
      </AppPage>
    )
  }

  return (
    <AppPage
      title="Irrigation sensors"
      description="Monitor farm conditions and manage automation rules."
      actions={
        <select
          value={selectedFarm}
          onChange={(e) => setSelectedFarm(e.target.value)}
          className={`px-4 py-3 rounded-lg border focus:ring-2 focus:ring-primary ${
            isDark ? 'bg-muted border-border text-white' : 'bg-background border-border text-foreground'
          }`}
        >
          {farms.map(farm => (
            <option key={farm.id} value={farm.id}>{farm.farmName || farm.name}</option>
          ))}
        </select>
      }
    >
      <PageScaffold
        aside={
          <IrrigationPageAside
            summary={[
              { label: 'Sensors', value: String(sensors.length) },
              { label: 'Automation rules', value: String(rules.length) },
              { label: 'Farms', value: String(farms.length) },
            ]}
          />
        }
      >
      <div className="space-y-6">
        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Sensor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {sensors.length === 0 ? (
            <div className={`col-span-full ops-panel interactive-card rounded-xl shadow-lg border p-12 text-center ${isDark ? 'bg-muted border-border' : 'bg-background border-border'}`}>
              <div className="text-6xl mb-4">📡</div>
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-foreground'}`}>
                No Sensor Data Available
              </h3>
              <p className={`mt-2 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                Connect IoT sensors to start monitoring your farm
              </p>
            </div>
          ) : (
            sensors.map((sensor, index) => {
              const config = SENSOR_TYPES[sensor.sensorType] || { label: sensor.sensorType, icon: '📊', unit: '' }
              const statusColor = getSensorColor(sensor.sensorType, sensor.value)
              
              return (
                <div
                  key={index}
                  className={`ops-panel interactive-card rounded-xl shadow-lg border p-6 transition hover:shadow-xl ${isDark ? 'bg-muted border-border' : 'bg-background border-border'}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{config.icon}</span>
                      <div>
                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-foreground'}`}>
                          {config.label}
                        </h3>
                        <p className={`text-xs ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                          {sensor.sensorId || 'Sensor'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[sensor.status] || STATUS_COLORS.ACTIVE}`}>
                      {sensor.status || 'ACTIVE'}
                    </span>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <span className={`text-4xl font-bold ${
                        statusColor === 'red' ? 'text-red-500' :
                        statusColor === 'yellow' ? 'text-yellow-500' :
                        statusColor === 'green' ? 'text-green-500' :
                        isDark ? 'text-white' : 'text-foreground'
                      }`}>
                        {sensor.value?.toFixed(1) || '-'}
                      </span>
                      <span className={`text-xl ml-1 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                        {config.unit}
                      </span>
                    </div>
                    <div className={`text-right text-xs ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                      <p>Updated</p>
                      <p>{formatDate(sensor.recordedAt || sensor.updatedAt)}</p>
                    </div>
                  </div>

                  {/* Mini Chart Placeholder */}
                  <div className={`mt-4 h-12 rounded flex items-end gap-1 ${isDark ? 'bg-muted/50' : 'bg-muted'}`}>
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-t ${
                          statusColor === 'red' ? 'bg-red-400' :
                          statusColor === 'yellow' ? 'bg-yellow-400' :
                          statusColor === 'green' ? 'bg-green-400' :
                          'bg-blue-400'
                        }`}
                        style={{ height: `${20 + Math.random() * 80}%`, opacity: 0.3 + (i / 12) * 0.7 }}
                      />
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Automation Rules Section */}
        <div className={`ops-panel interactive-card rounded-xl shadow-lg border overflow-hidden ${isDark ? 'bg-muted border-border' : 'bg-background border-border'}`}>
          <div className="p-6 border-b border-border dark:border-border flex justify-between items-center">
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>
                Automation Rules
              </h2>
              <p className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                Set up automatic irrigation based on sensor readings
              </p>
            </div>
            <button
              onClick={() => setShowRuleForm(!showRuleForm)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
            >
              {showRuleForm ? '✕ Cancel' : '+ Add Rule'}
            </button>
          </div>

          {/* Rule Form */}
          {showRuleForm && (
            <div className={`p-6 border-b ${isDark ? 'bg-muted/50 border-border' : 'bg-muted/50 border-border'}`}>
              <form onSubmit={handleCreateRule} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                    When
                  </label>
                  <select
                    value={ruleForm.sensorType}
                    onChange={(e) => setRuleForm({ ...ruleForm, sensorType: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-muted border-border text-white' : 'bg-background border-border'}`}
                  >
                    {Object.entries(SENSOR_TYPES).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                    Is
                  </label>
                  <select
                    value={ruleForm.conditionType}
                    onChange={(e) => setRuleForm({ ...ruleForm, conditionType: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-muted border-border text-white' : 'bg-background border-border'}`}
                  >
                    <option value="BELOW">Below</option>
                    <option value="ABOVE">Above</option>
                    <option value="EQUALS">Equals</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                    Threshold
                  </label>
                  <input
                    type="number"
                    value={ruleForm.thresholdValue}
                    onChange={(e) => setRuleForm({ ...ruleForm, thresholdValue: e.target.value })}
                    required
                    step="0.1"
                    placeholder="e.g., 30"
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-muted border-border text-white' : 'bg-background border-border'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                    Then
                  </label>
                  <select
                    value={ruleForm.action}
                    onChange={(e) => setRuleForm({ ...ruleForm, action: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-muted border-border text-white' : 'bg-background border-border'}`}
                  >
                    <option value="TURN_ON_IRRIGATION">Turn On Irrigation</option>
                    <option value="TURN_OFF_IRRIGATION">Turn Off Irrigation</option>
                    <option value="SEND_ALERT">Send Alert</option>
                    <option value="SCHEDULE_CHECK">Schedule Check</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Rule'}
                </button>
              </form>
            </div>
          )}

          {/* Rules List */}
          <div className="divide-y divide-border dark:divide-border">
            {rules.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-5xl mb-4">⚙️</div>
                <p className={isDark ? 'text-muted-foreground' : 'text-muted-foreground'}>
                  No automation rules configured yet
                </p>
              </div>
            ) : (
              rules.map((rule, index) => {
                const sensor = SENSOR_TYPES[rule.sensorType] || { label: rule.sensorType, icon: '📊' }
                return (
                  <div key={index} className={`p-4 flex items-center justify-between ${isDark ? 'hover:bg-muted/50' : 'hover:bg-muted/50'}`}>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{sensor.icon}</span>
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-foreground'}`}>
                          When <span className="font-semibold">{sensor.label}</span> is{' '}
                          <span className="text-blue-500">{rule.conditionType?.toLowerCase()}</span>{' '}
                          <span className="font-semibold">{rule.thresholdValue}</span>
                        </p>
                        <p className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                          → {rule.action?.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleRuleStatus(rule.id, rule.isActive)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                          rule.isActive 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-muted text-foreground hover:bg-muted dark:bg-muted/30 dark:text-muted-foreground'
                        }`}
                      >
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        title="Delete rule"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={fetchSensorData}
            className={`ops-panel interactive-card p-4 rounded-xl border flex items-center gap-3 transition ${
              isDark ? 'bg-muted border-border hover:bg-muted' : 'bg-background border-border hover:bg-muted/50'
            }`}
          >
            <span className="text-2xl">🔄</span>
            <div className="text-left">
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-foreground'}`}>Refresh Data</p>
              <p className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Update sensor readings</p>
            </div>
          </button>

          <button
            className={`ops-panel interactive-card p-4 rounded-xl border flex items-center gap-3 transition ${
              isDark ? 'bg-muted border-border hover:bg-muted' : 'bg-background border-border hover:bg-muted/50'
            }`}
          >
            <span className="text-2xl">💧</span>
            <div className="text-left">
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-foreground'}`}>Manual Irrigation</p>
              <p className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Start watering now</p>
            </div>
          </button>

          <button
            className={`ops-panel interactive-card p-4 rounded-xl border flex items-center gap-3 transition ${
              isDark ? 'bg-muted border-border hover:bg-muted' : 'bg-background border-border hover:bg-muted/50'
            }`}
          >
            <span className="text-2xl">📊</span>
            <div className="text-left">
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-foreground'}`}>View History</p>
              <p className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Sensor data trends</p>
            </div>
          </button>
        </div>
      </div>
      </PageScaffold>
    </AppPage>
  )
}

export default IrrigationSensorDashboard
