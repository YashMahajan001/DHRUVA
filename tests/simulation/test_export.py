from pathlib import Path

from data.generators.export import export_csv, export_json
from simulation.engine_simulator import generate_telemetry


def test_csv_and_json_export(tmp_path: Path):
    df = generate_telemetry(duration=6, seed=1)
    csv_path = export_csv(df, tmp_path / "out.csv")
    json_path = export_json(df, tmp_path / "out.json")
    assert csv_path.is_file()
    assert json_path.is_file()
    text = csv_path.read_text(encoding="utf-8").splitlines()[0]
    assert text.startswith("timestamp,engine_id,model_id")
    assert json_path.read_text(encoding="utf-8").lstrip().startswith("[")
