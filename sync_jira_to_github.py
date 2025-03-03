import os
from jira import JIRA
from github import Github

# Retrieve environment variables
jira_server = os.getenv('JIRA_BASE_URL')
jira_email = os.getenv('JIRA_EMAIL')
jira_api_token = os.getenv('JIRA_API_TOKEN')
github_token = os.getenv('GITHUB_TOKEN')
github_repo_name = os.getenv('GITHUB_REPOSITORY')
github_project_id = os.getenv('GITHUB_PROJECT_ID')
jira_parent_issue_id = 'EVENT-1'  # Replace with your Jira parent issue ID for Event Booking Platform

# Initialize Jira client
jira_options = {'server': jira_server}
jira = JIRA(options=jira_options, basic_auth=(jira_email, jira_api_token))

# Initialize GitHub client
github = Github(github_token)
repo = github.get_repo(github_repo_name)
project = github.get_project(int(github_project_id))

# Get GitHub project columns (To Do, In Progress, Done)
to_do_column = None
in_progress_column = None
done_column = None

for column in project.get_columns():
    if column.name.lower() == 'to do':
        to_do_column = column
    elif column.name.lower() == 'in progress':
        in_progress_column = column
    elif column.name.lower() == 'done':
        done_column = column

def create_github_issue(title, description, labels=None):
    """Create a new GitHub issue with the given title and description."""
    issue = repo.create_issue(title=title, body=description, labels=labels)
    return issue

def add_issue_to_project_column(issue, status):
    """Add the created GitHub issue to the appropriate column based on status."""
    if status.lower() == 'to do':
        if to_do_column:
            to_do_column.create_card(content_id=issue.id, content_type="Issue")
    elif status.lower() == 'in progress':
        if in_progress_column:
            in_progress_column.create_card(content_id=issue.id, content_type="Issue")
    elif status.lower() == 'done':
        if done_column:
            done_column.create_card(content_id=issue.id, content_type="Issue")

def get_microservice_label(summary):
    """Determine which microservice label to apply based on the issue summary."""
    summary_lower = summary.lower()
    if 'user service' in summary_lower:
        return 'user-service'
    elif 'event service' in summary_lower:
        return 'event-service'
    elif 'booking service' in summary_lower:
        return 'booking-service'
    elif 'notification service' in summary_lower:
        return 'notification-service'
    elif 'infrastructure' in summary_lower or 'docker' in summary_lower:
        return 'infrastructure'
    else:
        return 'general'

def process_jira_issues(issue_id):
    """Recursively process Jira issues and create corresponding GitHub issues."""
    issue = jira.issue(issue_id)
    title = f'[{issue.key}] {issue.fields.summary}'
    description = issue.fields.description or ""
    
    # Determine status
    status = issue.fields.status.name
    
    # Determine labels
    microservice_label = get_microservice_label(issue.fields.summary)
    priority_label = f'priority-{issue.fields.priority.name.lower()}' if hasattr(issue.fields, 'priority') else 'priority-normal'
    labels = [microservice_label, priority_label]
    
    # Create GitHub issue
    github_issue = create_github_issue(title, description, labels)
    add_issue_to_project_column(github_issue, status)
    
    print(f"Created GitHub issue: {github_issue.title} with status: {status}")

    # Process subtasks
    for subtask in issue.fields.subtasks:
        process_jira_issues(subtask.key)

# Start processing from the main parent issue
print("Starting to process Jira issues...")
process_jira_issues(jira_parent_issue_id)
print("Finished processing Jira issues.") 