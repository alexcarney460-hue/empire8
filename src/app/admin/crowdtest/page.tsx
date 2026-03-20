'use client';

import { useState } from 'react';
import { COLORS } from '@/lib/admin/theme';
import { ApiKeysSection } from './components/ApiKeysSection';
import { TestRunnerSection } from './components/TestRunnerSection';
import { TestHistorySection } from './components/TestHistorySection';

const TEXT_PRIMARY = '#ffffff';
const TEXT_SECONDARY = 'rgba(255,255,255,0.55)';

export default function CrowdTestPage() {
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bgPage, padding: '32px 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: TEXT_PRIMARY, marginBottom: 4 }}>
            CrowdTest
          </h1>
          <p style={{ fontSize: '0.85rem', color: TEXT_SECONDARY }}>
            Run synthetic audience testing with AI-generated personas. Configure your LLM key, run tests, and review results.
          </p>
        </div>

        {/* Section A: API Keys */}
        <ApiKeysSection />

        {/* Section B: Test Runner */}
        <TestRunnerSection onTestCreated={() => setHistoryRefreshKey((k) => k + 1)} />

        {/* Section C: Test History */}
        <TestHistorySection refreshKey={historyRefreshKey} />
      </div>
    </div>
  );
}
