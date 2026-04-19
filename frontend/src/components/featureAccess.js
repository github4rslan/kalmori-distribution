export const LOCKED_FEATURES_BY_PLAN = {
  free: ['spotify_canvas', 'content_id', 'collaborations', 'presave', 'fan_analytics', 'leaderboard', 'goals', 'ai_strategy'],
  rise: ['spotify_canvas', 'content_id', 'leaderboard', 'presave', 'ai_strategy'],
  pro: [],
};

export const getLockedFeaturesForPlan = (plan) => LOCKED_FEATURES_BY_PLAN[plan] || LOCKED_FEATURES_BY_PLAN.free;

export const isFeatureLocked = (plan, feature) => getLockedFeaturesForPlan(plan).includes(feature);

export const getRequiredPlansForFeature = (feature) =>
  Object.keys(LOCKED_FEATURES_BY_PLAN).filter((plan) => !isFeatureLocked(plan, feature));
