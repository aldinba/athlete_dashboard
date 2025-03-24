# Training Metrics Documentation

This document provides detailed information about the training metrics implemented in the Athlete Dashboard application.

## Key Metrics

### TRIMP (Training Impulse)

TRIMP quantifies the training load of a single workout based on duration and intensity.

**Formula:**
```
TRIMP = duration (minutes) × intensity factor
```

Where intensity factor is calculated as:
```
intensity factor = HRR × 0.64 × e^(1.92 × HRR)
```

And HRR (Heart Rate Reserve) is:
```
HRR = (avg_hr - resting_hr) / (max_hr - resting_hr)
```

**Interpretation:**
- Higher TRIMP values indicate more intense or longer workouts
- TRIMP values typically range from 30-300 depending on workout intensity and duration
- Recovery workouts: 30-60
- Moderate workouts: 60-120
- Hard workouts: 120-200
- Very hard workouts: 200+

### ATL (Acute Training Load)

ATL represents short-term fatigue and is calculated as an exponentially weighted average of daily TRIMP values with a time constant of 7 days.

**Formula:**
```
ATL_today = ATL_yesterday + (TRIMP_today - ATL_yesterday) / 7
```

**Interpretation:**
- ATL rises quickly with hard training
- ATL falls quickly with rest
- Represents "fatigue" in the fitness-fatigue model
- Typical values range from 30-150 for recreational runners
- Higher values (100+) indicate high fatigue levels

### CTL (Chronic Training Load)

CTL represents long-term fitness and is calculated as an exponentially weighted average of daily TRIMP values with a time constant of 42 days.

**Formula:**
```
CTL_today = CTL_yesterday + (TRIMP_today - CTL_yesterday) / 42
```

**Interpretation:**
- CTL rises and falls slowly
- Represents "fitness" in the fitness-fatigue model
- Typical values range from 30-120 for recreational runners
- Higher values indicate better aerobic fitness
- Rapid increases (>5-10 points/week) increase injury risk

### TSB (Training Stress Balance)

TSB represents the balance between fitness and fatigue, often referred to as "form".

**Formula:**
```
TSB = CTL - ATL
```

**Interpretation:**
- Positive TSB: Fresh, well-recovered state (good for races)
- Negative TSB: Fatigued state (good for building fitness)
- Very negative TSB (<-30): Risk of overtraining
- Recommended ranges:
  - Building fitness: -10 to -30
  - Maintenance: -5 to +5
  - Race preparation: +5 to +25

### VO2max Estimate

VO2max is estimated using heart rate and pace data from workouts.

**Simplified Firstbeat Method:**
```
VO2max ≈ 15 * (max speed in km/h) / (avg HR / max HR)
```

**Interpretation:**
- Higher values indicate better aerobic capacity
- Typical ranges:
  - Untrained: 25-35 ml/kg/min
  - Recreational runners: 35-50 ml/kg/min
  - Elite runners: 60-85 ml/kg/min
- Increases of 1-2 ml/kg/min per month indicate good training adaptation

### HR Drift

HR drift measures cardiovascular efficiency by comparing heart rate between the first and second half of a workout at similar intensities.

**Formula:**
```
HR Drift = ((avg_hr_second_half - avg_hr_first_half) / avg_hr_first_half) * 100
```

**Interpretation:**
- Lower values indicate better cardiovascular efficiency
- <5%: Excellent efficiency
- 5-10%: Good efficiency
- 10-15%: Moderate efficiency
- >15%: Poor efficiency
- Decreasing HR drift over time indicates improved aerobic fitness

## Using These Metrics

### Training Planning

1. **Building Fitness:**
   - Gradually increase CTL (1-5 points/week)
   - Maintain negative TSB (-10 to -30)
   - Include recovery weeks every 3-4 weeks (allow TSB to rise)

2. **Race Preparation:**
   - Taper by reducing training volume
   - Allow ATL to drop while maintaining CTL
   - Target positive TSB (+5 to +25) on race day

3. **Recovery:**
   - Monitor ATL and ensure it decreases during recovery periods
   - Allow TSB to rise to positive values
   - Resume training when TSB is positive

### Injury Prevention

1. **Warning Signs:**
   - Rapid CTL increase (>10 points/week)
   - Consistently very negative TSB (<-30)
   - Increasing HR drift despite similar workouts

2. **Preventive Actions:**
   - Limit CTL increases to 5-8 points/week
   - Include recovery weeks with positive TSB
   - Monitor HR drift for signs of fatigue

### Performance Optimization

1. **Race Timing:**
   - Schedule key races when TSB is positive
   - Taper duration depends on race distance (longer races need longer tapers)
   - Monitor VO2max estimates for peak fitness timing

2. **Training Effectiveness:**
   - Decreasing HR drift indicates improving efficiency
   - Increasing VO2max estimates indicate improving fitness
   - Stable or increasing CTL indicates effective training load

## Dashboard Visualization

The Athlete Dashboard visualizes these metrics to help athletes:

1. **Track Training Load:**
   - CTL/ATL/TSB chart over time
   - Weekly TRIMP distribution
   - Training load color zones (green/yellow/red)

2. **Monitor Fitness:**
   - VO2max trend
   - HR drift trend
   - Performance predictions

3. **Plan Training:**
   - Recovery status indicators
   - Training recommendations
   - Race readiness score

## References

1. Banister, E. W. (1991). Modeling Elite Athletic Performance. In Physiological Testing of Elite Athletes (pp. 403-424).
2. Skiba, P. F. (2006). Calculation of Power Output and Quantification of Training Stress in Distance Runners. Unpublished.
3. Firstbeat Technologies Ltd. (2014). Automated Fitness Level (VO2max) Estimation with Heart Rate and Speed Data.
4. Lamberts, R. P., & Lambert, M. I. (2009). Day-to-day variation in heart rate at different levels of submaximal exertion: implications for monitoring training. Journal of Strength and Conditioning Research, 23(3), 1005-1010.
