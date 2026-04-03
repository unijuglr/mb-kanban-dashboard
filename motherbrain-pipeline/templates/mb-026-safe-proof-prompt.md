Create exactly these files in the task working directory and nowhere else:
- `notes.txt` containing a one-line summary of the task id
- `result.json` containing valid JSON with keys `task_id` and `status`
Then run a bounded validation command that lists those files.
Do not modify git state outside the declared task files.
