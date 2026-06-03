decision_history = []

def store_decision(entry: dict):
    decision_history.append(entry)

def get_history():
    return decision_history
