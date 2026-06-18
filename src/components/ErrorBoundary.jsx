import { Component } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

// Catches render-time errors so a crash shows a message instead of a blank screen.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    console.error('UI error:', error, info)
  }
  reset = () => this.setState({ error: null })
  render() {
    if (this.state.error) {
      return (
        <div className="max-w-lg mx-auto mt-10 card text-center">
          <div className="grid place-items-center h-14 w-14 rounded-2xl bg-rose-500/10 text-rose-600 mx-auto mb-4">
            <AlertTriangle size={26} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Something went wrong on this page</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4 break-words">{String(this.state.error?.message || this.state.error)}</p>
          <div className="flex gap-2 justify-center">
            <button className="btn-outline" onClick={this.reset}><RotateCcw size={16} /> Try again</button>
            <button className="btn-primary" onClick={() => (window.location.href = '/')}>Go to Dashboard</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
