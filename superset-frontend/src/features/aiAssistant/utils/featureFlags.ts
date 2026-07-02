declare global {
  interface Window {
    bootstrapData?: {
      common?: {
        conf?: {
          FEATURE_FLAGS?: Record<string, boolean>;
        };
        user?: {
          username?: string;
          email?: string;
        };
      };
    };
  }
}


export const isFeatureEnabled = (
  flag: string,
  defaultValue = false
): boolean => {
  const flags = window?.bootstrapData?.common?.conf?.FEATURE_FLAGS;
  
  // ✅ if flag not defined → use default
  if (!flags || flags[flag] === undefined) {
    return defaultValue;
  }

  return Boolean(flags[flag]);
};