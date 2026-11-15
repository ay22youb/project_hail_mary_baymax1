"""Short, attributed background notes from the team's challenge resources."""

SOURCES = [
    {
        "title": "NASA: Five Hazards of Human Spaceflight",
        "url": "https://www.nasa.gov/hrp/hazards/",
        "terms": ("space", "hazard", "radiation", "isolation", "gravity", "environment", "mars"),
        "note": "NASA identifies radiation, isolation and confinement, distance from Earth, altered gravity, and closed or hostile environments as five interacting spaceflight hazards.",
    },
    {
        "title": "NASA: Risks of Human Spaceflight",
        "url": "https://www.nasa.gov/hrp/risks/",
        "terms": ("risk", "heart", "cardio", "oxygen", "hypoxia", "immune", "bone", "sleep", "stress", "mood", "nutrition"),
        "note": "NASA describes risks involving cardiovascular adaptation, mild hypoxia, altered immune response, bone changes, inadequate sleep, and behavioral health. These are research risks, not diagnoses from a single reading.",
    },
    {
        "title": "NASA: Risk of Inadequate Food and Nutrition",
        "url": "https://www.nasa.gov/reference/risk-of-inadequate-food-and-nutrition/",
        "terms": ("food", "diet", "meal", "appetite", "nutrition", "menu"),
        "note": "NASA emphasizes adequate nutrition, food safety, variety, shelf life, and food acceptability on long missions. A meal log alone cannot determine whether nutrient needs are met; persistent low intake deserves review with the crew nutrition or medical team.",
    },
    {
        "title": "NASA: Ongoing Human Research",
        "url": "https://www.nasa.gov/hrp/ongoing-hrp-research/",
        "terms": ("research", "study", "measure", "activity", "sleep", "biomarker", "record"),
        "note": "NASA lists studies including ARCHeR for well-being, activity and sleep, and Standard Measures for consistent physiological and psychological data collection. The overview does not publish individual crew records.",
    },
    {
        "title": "CSA: Monitoring Radiation for Astronaut Health",
        "url": "https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp",
        "terms": ("radiation", "neutron", "exposure", "dose", "cans"),
        "note": "The Canadian Space Agency describes CANS as a continuously operating neutron exposure instrument. This article does not provide a live radiation feed or personal dose records.",
    },
    {
        "title": "CSA: Why Conduct Experiments in Space",
        "url": "https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp",
        "terms": ("experiment", "research", "gravity", "isolation", "radiation", "deep space", "mission"),
        "note": "The Canadian Space Agency explains that long missions increase exposure to weightlessness, radiation, isolation, communication delays, and limited access to Earth-based medical support.",
    },
]


def relevant_sources(question: str) -> list[dict[str, str]]:
    words = question.lower()
    matches = [source for source in SOURCES if any(term in words for term in source["terms"])]
    return matches[:2]
