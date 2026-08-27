import { Component } from 'react'

function didResetKeysChange(previousKeys = [], nextKeys = []) {
  if (previousKeys.length !== nextKeys.length) {
    return true
  }

  return previousKeys.some((value, index) => value !== nextKeys[index])
}

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error) {
    console.error('Unhandled UI error:', error)
  }

  componentDidUpdate(previousProps) {
    const previousKeys = previousProps.resetKeys || []
    const nextKeys = this.props.resetKeys || []

    if (this.state.hasError && didResetKeysChange(previousKeys, nextKeys)) {
      this.handleReset()
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    })

    if (typeof this.props.onReset === 'function') {
      this.props.onReset()
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <main className="mx-auto max-w-350 flex-1 bg-[#eef2f8] px-4 py-8 md:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Something went wrong
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">
            The page hit an unexpected error.
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Please retry this view. If the issue continues, refresh your session.
          </p>
          {this.state.hasError ? (
            <p className="mt-3 rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
              An unexpected error occurred while loading this view. Our team has been notified.
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Retry page
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
            >
              Reload app
            </button>
          </div>
        </section>
      </main>
    )
  }
}
