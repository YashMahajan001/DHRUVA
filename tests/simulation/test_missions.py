from simulation.missions.phases import ALLOWED_PHASES
from simulation.missions.profiles import MISSION_FILES, get_mission_profile, sample_mission


def test_mission_profile_loading():
    for mission_id in MISSION_FILES:
        profile = get_mission_profile(mission_id)
        assert profile.mission_id == mission_id
        assert profile.phases
        assert all(p.phase in ALLOWED_PHASES for p in profile.phases)


def test_mission_phases_cover_takeoff_and_landing():
    profile = get_mission_profile("HIGH_ALTITUDE_ISR")
    names = [p.phase for p in profile.phases]
    assert names[0] == "TAKEOFF"
    assert names[-1] == "LANDING"
    start = sample_mission(profile, 0.0, 1000.0)
    end = sample_mission(profile, 999.0, 1000.0)
    assert start.phase == "TAKEOFF"
    assert end.phase == "LANDING"
