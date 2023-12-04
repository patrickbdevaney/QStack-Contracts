declare global {
  const msg: { sender: Address };
}

import { Contract } from '@algorandfoundation/tealscript';
import { ProjectProposal } from './types/ProjectProposal';
import { Contribution } from './types/Contribution';

class proposal extends Contract {
  projectProposals: Map<number, ProjectProposal> = new Map();
  projectContributions: Map<number, Contribution[]> = new Map();

  

  async submitProjectProposal(projectProposal: ProjectProposal) {
    
  
    // Track contributions for the project
    const projectID = this.projectProposals.size + 1;
    const projectContributions = this.projectContributions.get(projectID) || [];
    const contribution = {
      contributor: msg.sender,
      amount: projectProposal.funding,
    };
    projectContributions.push(contribution);
    this.projectContributions.set(projectID, projectContributions);
  
    // Calculate matched funds using the quadratic funding formula
    const totalContributions = projectContributions.reduce((sum, contribution) => sum + contribution.amount, 0);
    const matchedFunds = ((totalContributions + 1) ** (1/2) - 1) ** 2;
  
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
    return projectProposal;
  }
}

  
