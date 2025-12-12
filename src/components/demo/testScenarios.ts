/**
 * testScenarios.ts
 * Pre-populated test scenarios for Developer Sandbox
 * 
 * Three high-value test scenarios demonstrating key capabilities:
 * 1. The Disruption Test - Real-time rerouting
 * 2. The Multi-Factor Optimization Test - Constraint juggling
 * 3. The Scale Test - Enterprise consolidation
 */

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  coreFunction: string;
  input: object;
  output: object;
}

export const testScenarios: TestScenario[] = [
  {
    id: 'disruption-test',
    name: 'The Disruption Test',
    description: 'Reliability & Real-Time Rerouting',
    coreFunction: 'Demonstrates how the engine adapts when external data indicates a flight cancellation, suggesting new transport and adjusting subsequent activities accordingly.',
    input: {
      userContext: {
        location: 'San Francisco International Airport (SFO)',
        time: '14:00',
        originalPlan: {
          flight: {
            airline: 'United Airlines',
            flightNumber: 'UA 1234',
            scheduledDeparture: '16:30',
            status: 'CANCELLED',
          },
          subsequentActivities: [
            {
              type: 'dinner',
              name: 'Fine Dining Restaurant',
              location: 'Downtown San Francisco',
              scheduledTime: '19:00',
              distanceFromAirport: '25 minutes',
            },
          ],
        },
        constraints: {
          mustArriveBy: '21:00',
          preference: 'minimal_walking',
          budget: 'moderate',
        },
      },
      externalData: {
        flightStatus: 'CANCELLED',
        alternativeFlights: [
          {
            airline: 'Delta Air Lines',
            flightNumber: 'DL 5678',
            scheduledDeparture: '18:45',
            arrival: '20:30',
            status: 'CONFIRMED',
          },
        ],
        transportOptions: [
          {
            type: 'rideshare',
            provider: 'Uber',
            estimatedDuration: '30 minutes',
            cost: '$35-45',
          },
          {
            type: 'public_transit',
            route: 'BART',
            estimatedDuration: '45 minutes',
            cost: '$12',
          },
        ],
      },
    },
    output: {
      recommendation: {
        title: 'Disruption-Aware Itinerary Adjustment',
        status: 'REOPTIMIZED',
        adjustments: [
          {
            type: 'transport_replacement',
            original: 'UA 1234 (CANCELLED)',
            replacement: 'DL 5678 (18:45 departure)',
            reason: 'Next available confirmed flight with similar arrival window',
          },
          {
            type: 'activity_repositioning',
            activity: 'Fine Dining Restaurant',
            originalTime: '19:00',
            newTime: '20:45',
            originalLocation: 'Downtown San Francisco',
            newLocation: 'Restaurant near new arrival terminal',
            reason: 'Optimized for post-arrival timing and minimal transport',
          },
        ],
        optimizedItinerary: {
          flight: {
            airline: 'Delta Air Lines',
            flightNumber: 'DL 5678',
            scheduledDeparture: '18:45',
            arrival: '20:30',
            status: 'CONFIRMED',
          },
          transportToDinner: {
            type: 'rideshare',
            provider: 'Uber',
            estimatedDuration: '15 minutes',
            cost: '$15-20',
            pickupTime: '20:45',
          },
          dinner: {
            name: 'Terminal Bistro (near Terminal 2)',
            location: 'SFO Terminal 2',
            scheduledTime: '21:00',
            cuisine: 'Contemporary American',
            walkingDistance: '2 minutes',
          },
        },
        reasoning: 'Reoptimized itinerary accounts for flight cancellation, selecting confirmed alternative flight and repositioning dinner to terminal location to meet arrival deadline while minimizing additional transport.',
      },
      metadata: {
        reroutingTriggered: true,
        externalDataSources: ['flight_status_api', 'transport_provider_api'],
        optimizationFactors: ['arrival_deadline', 'minimal_transport', 'time_efficiency'],
        confidence: 0.92,
      },
    },
  },
  {
    id: 'multi-factor-test',
    name: 'The Multi-Factor Optimization Test',
    description: 'Intelligence & Constraint Juggling',
    coreFunction: 'Demonstrates AI capability to find optimal path meeting contradictory constraints: high-priority museum, low-priority budget lunch, strict public transport requirement, and mandatory 1:00 PM appointment.',
    input: {
      userContext: {
        location: 'Paris, France',
        date: '2024-06-15',
        constraints: [
          {
            type: 'mandatory_appointment',
            description: 'Business meeting at client office',
            location: 'La Défense',
            time: '13:00',
            duration: '1 hour',
            priority: 'CRITICAL',
          },
          {
            type: 'high_priority_activity',
            description: 'Visit Musée d\'Orsay',
            location: '1 Rue de la Légion d\'Honneur, 75007 Paris',
            priority: 'HIGH',
            preferredTime: 'morning',
          },
          {
            type: 'budget_constraint',
            description: 'Lunch budget',
            maxBudget: '€15',
            priority: 'LOW',
          },
          {
            type: 'transport_constraint',
            description: 'Public transport only',
            allowedModes: ['metro', 'bus', 'walking'],
            priority: 'HIGH',
          },
        ],
        preferences: {
          museumVisitDuration: '2-3 hours',
          lunchCuisine: 'casual',
        },
      },
    },
    output: {
      recommendation: {
        title: 'Multi-Constraint Optimized Itinerary',
        status: 'OPTIMIZED',
        itinerary: [
          {
            time: '09:00',
            activity: 'Visit Musée d\'Orsay',
            location: '1 Rue de la Légion d\'Honneur, 75007 Paris',
            duration: '2.5 hours',
            transport: {
              method: 'metro',
              line: 'Line 12',
              from: 'Starting location',
              to: 'Solférino',
              duration: '20 minutes',
              cost: '€1.90',
            },
            priority: 'HIGH',
          },
          {
            time: '12:15',
            activity: 'Lunch at Budget-Friendly Café',
            location: 'Café de la Paix (near La Défense)',
            cuisine: 'French bistro',
            cost: '€12-14',
            transport: {
              method: 'metro',
              line: 'Line 12 → Line 1',
              from: 'Solférino',
              to: 'La Défense',
              duration: '35 minutes',
              cost: '€1.90',
            },
            priority: 'LOW',
            constraintMet: 'Budget under €15, en route to appointment',
          },
          {
            time: '13:00',
            activity: 'Business Meeting',
            location: 'La Défense',
            duration: '1 hour',
            priority: 'CRITICAL',
            constraintMet: 'Mandatory appointment satisfied',
          },
        ],
        optimizationSummary: {
          allConstraintsMet: true,
          optimizationFactors: [
            'Museum visited in morning before appointment',
            'Lunch positioned strategically on route to appointment',
            'Budget constraint satisfied with €12-14 lunch option',
            'Public transport used throughout (metro lines 12 and 1)',
            'Minimal walking between metro stops and destinations',
          ],
          totalTransportCost: '€5.70',
          totalLunchCost: '€12-14',
          efficiencyScore: 0.95,
        },
      },
      metadata: {
        constraintCount: 4,
        conflictingConstraints: ['high_priority_museum', 'low_priority_budget', 'strict_public_transport', 'mandatory_appointment'],
        resolutionStrategy: 'sequential_optimization_with_transit_planning',
        confidence: 0.94,
      },
    },
  },
  {
    id: 'scale-test',
    name: 'The Scale Test',
    description: 'Enterprise & Consolidation',
    coreFunction: 'Demonstrates enterprise-scale handling of 12 travelers from 4 departure cities with conflicting preferences, producing consolidated JSON output with aggregated itineraries and compliance reporting.',
    input: {
      groupTravel: {
        totalTravelers: 12,
        departureCities: [
          { city: 'New York', travelers: 4, arrivalWindow: '10:00-12:00' },
          { city: 'Los Angeles', travelers: 3, arrivalWindow: '11:00-13:00' },
          { city: 'Chicago', travelers: 3, arrivalWindow: '12:00-14:00' },
          { city: 'Miami', travelers: 2, arrivalWindow: '13:00-15:00' },
        ],
        destination: 'San Francisco, CA',
        date: '2024-07-20',
        preferences: {
          traveler1: { budget: 'high', activities: ['museums', 'fine_dining'], mobility: 'full' },
          traveler2: { budget: 'moderate', activities: ['outdoor', 'casual_dining'], mobility: 'full' },
          traveler3: { budget: 'low', activities: ['free_attractions', 'budget_food'], mobility: 'limited' },
          traveler4: { budget: 'high', activities: ['nightlife', 'entertainment'], mobility: 'full' },
          traveler5: { budget: 'moderate', activities: ['cultural', 'mid_range_dining'], mobility: 'full' },
          traveler6: { budget: 'low', activities: ['parks', 'street_food'], mobility: 'full' },
          traveler7: { budget: 'high', activities: ['shopping', 'luxury_dining'], mobility: 'full' },
          traveler8: { budget: 'moderate', activities: ['museums', 'casual_dining'], mobility: 'limited' },
          traveler9: { budget: 'low', activities: ['outdoor', 'budget_food'], mobility: 'full' },
          traveler10: { budget: 'high', activities: ['fine_dining', 'entertainment'], mobility: 'full' },
          traveler11: { budget: 'moderate', activities: ['cultural', 'mid_range_dining'], mobility: 'full' },
          traveler12: { budget: 'low', activities: ['free_attractions', 'street_food'], mobility: 'limited' },
        },
        constraints: {
          groupActivities: [
            { type: 'welcome_dinner', time: '19:00', participation: 'required_all' },
            { type: 'morning_briefing', time: '09:00', participation: 'required_all' },
          ],
          individualFlexibility: true,
          budgetComplianceRequired: true,
        },
      },
    },
    output: {
      recommendation: {
        title: 'Enterprise Group Itinerary - 12 Travelers Consolidated',
        status: 'CONSOLIDATED',
        groupSummary: {
          totalTravelers: 12,
          arrivalGroups: [
            {
              arrivalWindow: '10:00-12:00',
              travelers: 4,
              cities: ['New York'],
              initialActivities: [
                {
                  time: '12:30',
                  activity: 'Group Lunch & Orientation',
                  location: 'Ferry Building Marketplace',
                  participants: 4,
                  budget: 'moderate',
                },
              ],
            },
            {
              arrivalWindow: '11:00-13:00',
              travelers: 3,
              cities: ['Los Angeles'],
              initialActivities: [
                {
                  time: '13:30',
                  activity: 'Guided City Walk',
                  location: 'Golden Gate Park',
                  participants: 3,
                  budget: 'free',
                },
              ],
            },
            {
              arrivalWindow: '12:00-14:00',
              travelers: 3,
              cities: ['Chicago'],
              initialActivities: [
                {
                  time: '14:30',
                  activity: 'Cultural District Exploration',
                  location: 'Mission District',
                  participants: 3,
                  budget: 'low',
                },
              ],
            },
            {
              arrivalWindow: '13:00-15:00',
              travelers: 2,
              cities: ['Miami'],
              initialActivities: [
                {
                  time: '15:30',
                  activity: 'Independent Exploration Time',
                  location: 'Downtown San Francisco',
                  participants: 2,
                  budget: 'variable',
                },
              ],
            },
          ],
        },
        consolidatedItineraries: [
          {
            time: '09:00',
            activity: 'Morning Briefing',
            location: 'Hotel Conference Room',
            participants: 'ALL (12)',
            type: 'group_required',
          },
          {
            time: '10:00-15:00',
            activity: 'Individual/Subgroup Activities',
            itineraries: [
              {
                group: 'High Budget Travelers (4)',
                activities: [
                  { time: '10:30', name: 'SFMOMA Museum', cost: '€25', participants: 2 },
                  { time: '12:00', name: 'Fine Dining Lunch', cost: '€60-80', participants: 2 },
                  { time: '14:00', name: 'Luxury Shopping', cost: 'variable', participants: 2 },
                ],
              },
              {
                group: 'Moderate Budget Travelers (5)',
                activities: [
                  { time: '11:00', name: 'Exploratorium', cost: '€30', participants: 3 },
                  { time: '13:00', name: 'Mid-Range Lunch', cost: '€25-35', participants: 5 },
                  { time: '14:30', name: 'Cultural Walking Tour', cost: '€15', participants: 2 },
                ],
              },
              {
                group: 'Low Budget Travelers (3)',
                activities: [
                  { time: '10:00', name: 'Free Golden Gate Bridge Walk', cost: 'free', participants: 3 },
                  { time: '12:30', name: 'Budget Food Truck Lunch', cost: '€8-12', participants: 3 },
                  { time: '14:00', name: 'Free Park Exploration', cost: 'free', participants: 3 },
                ],
              },
            ],
          },
          {
            time: '19:00',
            activity: 'Welcome Dinner',
            location: 'Group-Friendly Restaurant (accommodates 12)',
            participants: 'ALL (12)',
            type: 'group_required',
            cost: '€40-50 per person',
          },
        ],
        complianceReport: {
          budgetCompliance: {
            highBudget: { travelers: 4, averageSpend: '€85-105', withinBudget: true },
            moderateBudget: { travelers: 5, averageSpend: '€40-50', withinBudget: true },
            lowBudget: { travelers: 3, averageSpend: '€8-12', withinBudget: true },
          },
          preferenceAlignment: {
            museums: { requested: 5, allocated: 5, satisfaction: 1.0 },
            fineDining: { requested: 4, allocated: 4, satisfaction: 1.0 },
            outdoor: { requested: 3, allocated: 3, satisfaction: 1.0 },
            budgetFood: { requested: 3, allocated: 3, satisfaction: 1.0 },
            cultural: { requested: 4, allocated: 4, satisfaction: 1.0 },
          },
          mobilityAccommodation: {
            fullMobility: { travelers: 9, activitiesAllocated: 'all_available', compliance: true },
            limitedMobility: { travelers: 3, activitiesAllocated: 'accessible_only', compliance: true },
          },
          groupRequirements: {
            welcomeDinner: { scheduled: true, allParticipants: true, location: 'accessible' },
            morningBriefing: { scheduled: true, allParticipants: true, location: 'accessible' },
          },
        },
      },
      metadata: {
        consolidationLevel: 'enterprise',
        totalItinerariesGenerated: 12,
        groupItineraries: 4,
        individualItineraries: 8,
        optimizationFactors: ['arrival_time_grouping', 'budget_tiering', 'preference_matching', 'mobility_accommodation'],
        confidence: 0.91,
      },
    },
  },
];

export function getScenarioById(id: string): TestScenario | undefined {
  return testScenarios.find(scenario => scenario.id === id);
}

