"""
End-to-End Streamlit UI Verification Tests using streamlit.testing.v1.AppTest.
Verifies startup, empty state, 1-click synthetic demo execution, Alert & Incident
tables, and zero-error rendering across all 7 Round 3 navigation pages.
"""

from pathlib import Path
from streamlit.testing.v1 import AppTest

APP_PATH = Path(__file__).resolve().parent.parent / "app.py"

NAV_PAGES = [
    "Security Overview",
    "Traffic Analysis",
    "Threat Detection",
    "Incident Investigation",
    "ML Model Center",
    "Reports",
    "About SENTINELMESH",
]


def test_app_empty_state_and_all_pages_render_cleanly():
    at = AppTest.from_file(APP_PATH, default_timeout=30)
    at.run()
    assert not at.exception, f"Startup exception: {at.exception}"

    for page in NAV_PAGES:
        at.session_state["nav_page"] = page
        at.run()
        assert not at.exception, f"Empty-state exception on '{page}': {at.exception}"


def test_full_demo_workflow_and_all_pages_populated():
    at = AppTest.from_file(APP_PATH, default_timeout=60)
    at.run()
    assert not at.exception

    # Click the sidebar 'Load & Run Synthetic Demo' button
    demo_btn = [b for b in at.sidebar.button if "Synthetic Demo" in b.label][0]
    demo_btn.click().run()
    assert not at.exception, f"Demo workflow exception: {at.exception}"

    assert at.session_state["raw_df"] is not None
    assert at.session_state["analysis_output"] is not None
    assert at.session_state["rf_artifact"] is not None
    assert at.session_state["iso_artifact"] is not None
    assert at.session_state["alerts_df"] is not None and not at.session_state["alerts_df"].empty
    assert at.session_state["incidents_df"] is not None and not at.session_state["incidents_df"].empty

    for page in NAV_PAGES:
        at.session_state["nav_page"] = page
        at.run()
        assert not at.exception, f"Populated-state exception on '{page}': {at.exception}"
