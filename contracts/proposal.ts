declare global {
  const msg: { sender: Address };
}

import { Contract } from '@algorandfoundation/tealscript';


declare interface Contribution {
  contributor: Address; // Address of the contributor
  amount: number; // Amount contributed
}

declare interface ProjectProposal {
  id: number; // Unique project proposal ID
  ownerAddress: Address; // Address of the project owner
  title: string; // Project title
  description: string; // Detailed project description
  fundingGoal: number; // Total funding goal for the project
  funding: number; // Amount of funding received for the project
  matchedFunds: number; // Amount of matched funds received through quadratic funding
}

class proposal extends Contract {
  projectProposals: Map<number, ProjectProposal> = new Map();
  projectContributions: Map<number, Contribution[]> = new Map();

  // Matching pool balance
  matchingPoolBalance: number = 0;

  async submitProjectProposal(projectProposal: ProjectProposal) {
    // Track contributions for the project
    const projectID = this.projectProposals.size + 1;
    const projectContributions = this.projectContributions.get(projectID) || [];
    const contribution = {
      contributor: msg.sender,
      amount: projectProposal.funding,
    };

    // Add contribution to the matching pool
    this.matchingPoolBalance += contribution.amount;
    projectContributions.push(contribution);
    this.projectContributions.set(projectID, projectContributions);

    // Calculate matched funds using the quadratic funding formula
    const totalContributions = projectContributions.reduce((sum, contribution) => sum + contribution.amount, 0);
    const matchedFunds = ((totalContributions + 1) ** (1 / 2) - 1) ** 2;

    // Update project proposal with matched funds
    projectProposal.matchedFunds = matchedFunds;

    // Store the project proposal in the map
    this.projectProposals.set(projectID, projectProposal);
  }

  async getProposalFundingData(proposalID: number): Promise<ProjectProposal> {
    const projectProposal = this.projectProposals.get(proposalID);
    if (!projectProposal) {
      throw new Error(`Proposal with ID ${proposalID} not found`);
    }

    const projectContributions = this.projectContributions.get(proposalID) || [];
    const totalContributions = projectContributions.reduce((sum, contribution) => sum + contribution.amount, 0);
    const matchedFunds = ((totalContributions + 1) ** (1 / 2) - 1) ** 2;

    projectProposal.matchedFunds = matchedFunds;
    return projectProposal;
  }
}