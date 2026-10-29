import { useEffect, useRef, useState } from 'react';
import { trackEvent } from '../../lib/checkAnalytics.js';

export const PLAN_MESSAGE_EXPERIMENT = 'ai-handoff-message-v1';

// Existing PostHog owns assignment. Absent/disabled flags use A; previews emit no experiment events.
export default function usePlanMessageExperiment(preview, edition) {
  const previewVariant = preview === 'a' || preview === 'b' ? preview : null;
  const [assigned, setAssigned] = useState(null);
  const lastExposure = useRef('');

  useEffect(() => {
    if (previewVariant || typeof window === 'undefined') return;
    const analytics = window.posthog;
    if (typeof analytics?.getFeatureFlag !== 'function') return;
    let cancelled = false;
    const update = () => {
      if (cancelled) return;
      try {
        // The async SDK replaces its queued bootstrap object, so read the current global.
        const current = window.posthog;
        if (current?.has_opted_out_capturing?.() === true) {
          setAssigned(null);
          return;
        }
        const value = current?.getFeatureFlag?.(PLAN_MESSAGE_EXPERIMENT);
        setAssigned(value === 'a' || value === 'b' ? value : null);
      } catch { /* blocked analytics must not affect the offer */ }
    };
    update();
    let unsubscribe;
    try { unsubscribe = analytics.onFeatureFlags?.(update); } catch { /* default remains usable */ }
    return () => {
      cancelled = true;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [previewVariant]);

  const variant = previewVariant || assigned || 'a';
  const active = !previewVariant && assigned !== null;
  useEffect(() => {
    const exposure = `${edition}:${variant}`;
    if (!active || lastExposure.current === exposure) return;
    lastExposure.current = exposure;
    trackEvent('plan_message_view', { experiment: PLAN_MESSAGE_EXPERIMENT, variant, edition });
  }, [active, variant, edition]);

  const trackConversationClick = () => {
    if (active) trackEvent('plan_message_conversation_click', {
      experiment: PLAN_MESSAGE_EXPERIMENT, variant, edition,
    });
  };
  return { variant, active, preview: Boolean(previewVariant), trackConversationClick };
}
