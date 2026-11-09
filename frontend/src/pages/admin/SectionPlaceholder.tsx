
interface SectionPlaceholderProps {
    title: string;
}

function SectionPlaceholder({ title }: SectionPlaceholderProps) {
    return (
        <div className="dashboard-page">
            <div className="dashboard-welcome">
                <div>
                    <h2>{title}</h2>
                    <p>
                        This section is currently under development.
                        Its functionality will be added in upcoming stages.
                    </p>
                </div>
            </div>

            <div className="dashboard-table-card">
                <h3>{title}</h3>
                <p>
                    We will implement the features for this section here.
                </p>
            </div>
        </div>
    );
}

export default SectionPlaceholder;
