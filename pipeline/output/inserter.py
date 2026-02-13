"""Insert processed arguments into the database."""

from rich.console import Console
from pipeline.models import ProcessedArgument
from pipeline.output.formatter import format_for_db
from pipeline.db import insert_argument

console = Console()


def insert_processed(argument: ProcessedArgument) -> int | None:
    """
    Insert a single processed argument into the DB.
    Returns the beef_number, or None on failure.
    """
    data = format_for_db(argument)
    try:
        beef_number = insert_argument(data)
        if beef_number:
            console.print(
                f"  [green]Inserted beef #{beef_number}:[/green] {argument.title}"
            )
        return beef_number
    except Exception as e:
        console.print(f"  [red]Insert error: {e}[/red]")
        return None


def insert_batch(arguments: list[ProcessedArgument]) -> list[int]:
    """
    Insert a batch of processed arguments.
    Returns list of beef_numbers that were successfully inserted.
    """
    beef_numbers: list[int] = []

    for arg in arguments:
        beef_number = insert_processed(arg)
        if beef_number is not None:
            beef_numbers.append(beef_number)

    console.print(
        f"\n[bold]Inserted {len(beef_numbers)}/{len(arguments)} arguments[/bold]"
    )
    return beef_numbers
