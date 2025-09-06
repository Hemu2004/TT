const calculateMatches = (currentUser, potentialMatches) => {
  return potentialMatches.map((user) => {
    let score = 0
    const reasons = []

    // Skill overlap scoring
    const currentUserSkills = currentUser.skills.map((s) => s.name.toLowerCase())
    const userSkills = user.skills.map((s) => s.name.toLowerCase())

    const skillOverlap = currentUserSkills.filter((skill) => userSkills.includes(skill)).length
    if (skillOverlap > 0) {
      score += skillOverlap * 20
      reasons.push(`${skillOverlap} shared skill${skillOverlap > 1 ? "s" : ""}`)
    }

    // Complementary skills (what I need vs what they offer)
    const complementarySkills = currentUser.interests.filter((interest) =>
      userSkills.includes(interest.toLowerCase()),
    ).length

    if (complementarySkills > 0) {
      score += complementarySkills * 30
      reasons.push(`${complementarySkills} skill${complementarySkills > 1 ? "s" : ""} you want to learn`)
    }

    // Location proximity
    if (currentUser.location?.lat && user.location?.lat) {
      const distance = calculateDistance(
        currentUser.location.lat,
        currentUser.location.lng,
        user.location.lat,
        user.location.lng,
      )

      if (distance < 50) {
        // Within 50km
        score += 15
        reasons.push("Nearby location")
      } else if (distance < 200) {
        // Within 200km
        score += 5
        reasons.push("Same region")
      }
    }

    // Profile completeness bonus
    if (user.bio && user.avatarUrl) {
      score += 10
      reasons.push("Complete profile")
    }

    // Availability overlap
    if (currentUser.availability?.days && user.availability?.days) {
      const availabilityOverlap = currentUser.availability.days.filter((day) =>
        user.availability.days.includes(day),
      ).length

      if (availabilityOverlap > 0) {
        score += availabilityOverlap * 5
        reasons.push("Similar availability")
      }
    }

    return {
      user,
      score: Math.min(score, 100), // Cap at 100
      reasons,
      matchPercentage: Math.min(score, 100),
    }
  })
}

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

module.exports = { calculateMatches }
