export interface ProjectProposal {
    id: number; // Unique project proposal ID
    ownerAddress: Address; // Address of the project owner
    title: string; // Project title
    description: string; // Detailed project description
    fundingGoal: number; // Total funding goal for the project
    
  }