# Future Features for Athlete Dashboard

This document outlines potential features for future phases of the Athlete Dashboard project, based on research of popular running analytics platforms including Runalyze, Strava, and Garmin Connect.

## Features from Runalyze

### Recovery Advisor (Medium Complexity)
- **Description**: Analyzes training load, sleep quality, and HRV to provide recovery recommendations.
- **Implementation**: Calculate recovery status based on TRIMP, sleep data (if available), and recent workout intensity.
- **Benefits**: Helps athletes avoid overtraining and optimize recovery periods.
- **Priority**: High (Phase 2)

### Training Effect (Medium Complexity)
- **Description**: Measures the impact of each workout on aerobic and anaerobic fitness.
- **Implementation**: Calculate aerobic and anaerobic training effect based on heart rate zones, intensity, and duration.
- **Benefits**: Provides insight into how each workout contributes to fitness development.
- **Priority**: Medium (Phase 2)

### Shoe Tracking (Low Complexity)
- **Description**: Track mileage on running shoes to know when to replace them.
- **Implementation**: Add shoe database with ability to assign shoes to workouts and track cumulative distance.
- **Benefits**: Helps prevent injuries from worn-out shoes and manage equipment.
- **Priority**: High (Phase 2)

### Weather Impact (Medium Complexity)
- **Description**: Record weather conditions for workouts and analyze their impact on performance.
- **Implementation**: Integrate with weather API to automatically record temperature, humidity, wind, etc. for outdoor workouts.
- **Benefits**: Helps explain performance variations and adjust expectations based on conditions.
- **Priority**: Medium (Phase 3)

### Race Time Prediction (Low Complexity)
- **Description**: Predict race times for various distances based on recent training data.
- **Implementation**: Implement multiple prediction models (e.g., Riegel formula, VO2max-based) and compare results.
- **Benefits**: Helps athletes set realistic race goals and pace strategies.
- **Priority**: High (Phase 2)

### Monotony, Training Strain, Stress Balance (Medium Complexity)
- **Description**: Additional metrics that warn of monotonous or too intensive training.
- **Implementation**: Calculate training monotony (variation in daily load) and strain (product of load and monotony).
- **Benefits**: Helps prevent overtraining and optimize training variety.
- **Priority**: Medium (Phase 3)

### Trend Analysis Tool (Medium Complexity)
- **Description**: Plot single activity values (pace, distance, duration, etc.) over time to see evolution.
- **Implementation**: Create interactive charts showing long-term trends of selected metrics.
- **Benefits**: Visualizes progress and identifies areas for improvement.
- **Priority**: Medium (Phase 2)

### Climb Score (Medium Complexity)
- **Description**: Categorize and analyze climbs in activities from small hills to mountains.
- **Implementation**: Calculate climb scores based on length and gradient profile using FIETS index.
- **Benefits**: Provides insights into elevation training and climbing ability.
- **Priority**: Low (Phase 3)

### Poster Generator (Low Complexity)
- **Description**: Generate visual posters of training data (route heatmap, route grid, circular, calendar).
- **Implementation**: Create templates for different poster styles and render based on user data.
- **Benefits**: Engaging way to visualize and share training accomplishments.
- **Priority**: Low (Phase 3)

## Features from Strava

### Relative Effort Scoring (Medium Complexity)
- **Description**: Measures cardiovascular work across different activities and intensities.
- **Implementation**: Calculate a score based on heart rate data and perceived exertion that allows comparison across different workout types.
- **Benefits**: Enables comparison between different types of workouts (e.g., short intense vs. long easy).
- **Priority**: High (Phase 2)

### Segment Comparison (High Complexity)
- **Description**: Compare performances on specific route segments across different workouts.
- **Implementation**: Identify matching segments in GPS data, store segment efforts, and provide comparison tools.
- **Benefits**: Allows tracking progress on specific routes and comparing with previous efforts.
- **Priority**: Medium (Phase 3)

### Social Feed (High Complexity)
- **Description**: Share workouts and achievements with friends and followers.
- **Implementation**: Create social graph, activity feed, kudos/comments system.
- **Benefits**: Adds motivation and community aspects to training.
- **Priority**: Low (Phase 3) - Explicitly mentioned as skippable for MVP

## Features from Garmin Connect

### Stress Score (Medium Complexity)
- **Description**: Measures overall stress levels based on heart rate variability.
- **Implementation**: Calculate stress score (1-100) based on HRV data during rest periods.
- **Benefits**: Helps understand overall stress load and recovery needs.
- **Priority**: Medium (Phase 2)

### Daily Recommendations (High Complexity)
- **Description**: Suggests workout types and intensities based on recovery status and training history.
- **Implementation**: Enhance AI coach to provide specific workout recommendations based on training load, recovery, and goals.
- **Benefits**: Takes guesswork out of training planning and optimizes workout selection.
- **Priority**: High (Phase 3)

### HRV-based Readiness (Medium Complexity)
- **Description**: Uses heart rate variability to assess training readiness.
- **Implementation**: Calculate baseline HRV range and monitor daily values to determine readiness status.
- **Benefits**: Provides physiological insight into recovery status and training readiness.
- **Priority**: High (Phase 2)

### Sleep/Recovery Influence on Training (High Complexity)
- **Description**: Analyzes sleep quality and its impact on training performance.
- **Implementation**: If sleep data is available (via integration with sleep tracking apps), correlate with training performance.
- **Benefits**: Helps understand the relationship between sleep quality and athletic performance.
- **Priority**: Medium (Phase 3)

### Training Readiness Score (High Complexity)
- **Description**: Comprehensive score combining sleep, recovery time, HRV status, acute load, and stress.
- **Implementation**: Develop algorithm that weighs multiple factors to produce a single readiness score.
- **Benefits**: Provides clear guidance on when to push hard and when to recover.
- **Priority**: High (Phase 3)

## Implementation Roadmap

### Phase 2 Priorities
1. Shoe tracking
2. Race time prediction
3. Relative Effort scoring
4. HRV-based readiness
5. Training Effect
6. Trend Analysis Tool
7. Map route display with Leaflet.js (already planned)
8. Workout comparison view (already planned)

### Phase 3 Priorities
1. Daily workout recommendations
2. Training Readiness Score
3. Sleep/Recovery influence
4. Weather impact analysis
5. Monotony and training strain
6. Segment comparison
7. Climb Score
8. Poster Generator
9. Social Feed (lowest priority)
