declare global {
  const msg: { sender: Address };
  function send(recipient: Address, amount: number): void;
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

    // Current funding period start and end timestamps
    fundingPeriodStart: number;
    fundingPeriodEnd: number;
  
    async initialize() {
      // Set the initial funding period
      this.fundingPeriodStart = globals.latestTimestamp;
      this.fundingPeriodEnd = this.fundingPeriodStart + 3 * 30 * 24 * 60 * 60; // 3 months in seconds
    }

    async fundMatchingPool(amount: number) {
      // Add the contribution to the matching pool balance (microAlgos)
      this.matchingPoolBalance += amount;
    }

    async getMatchingPoolBalance(): Promise<number> {
      return this.matchingPoolBalance;
    }
    
    async getFundingPeriodData(): Promise<{ start: number; end: number }> {
      return {
        start: this.fundingPeriodStart,
        end: this.fundingPeriodEnd,
      };
    }

  async submitProjectProposal(projectProposal: ProjectProposal) {
    const currentTime = globals.latestTimestamp;
    if (currentTime < this.fundingPeriodStart || currentTime > this.fundingPeriodEnd) {
      throw new Error('Proposals can only be submitted during the active funding period');
    }
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
  // Consider adding a governance mechanism to revoke funds distributed if needed
  // However, this contradicts the ethos of quadratic funding
  async distributeMatchedFunds(send: (recipient: Address, amount: number) => void) {
    // Check if the current time is after the funding period end
    const currentTime = globals.latestTimestamp;
    if (currentTime <= this.fundingPeriodEnd) {
      throw new Error('Matched funds can only be distributed after the funding period ends');
    }
  
    // Calculate and distribute matched funds to eligible projects
    for (const [projectID, projectProposal] of this.projectProposals) {
      const projectContributions = this.projectContributions.get(projectID) || [];
      const totalContributions = projectContributions.reduce((sum, contribution) => sum + contribution.amount, 0);
      const matchedFunds = ((totalContributions + 1) ** (1 / 2) - 1) ** 2;
  
      // Transfer matched funds to project owner's address
      const projectOwnerAddress = projectProposal.ownerAddress;
      send(projectOwnerAddress, matchedFunds);
  
      // Reset project proposal's matched funds
      projectProposal.matchedFunds = 0;
      this.projectProposals.set(projectID, projectProposal);
    }
  
    // Start a new funding period
    this.startNewFundingPeriod();
  }

  async startNewFundingPeriod() {
    // Reset funding period start and end timestamps
    this.fundingPeriodStart = globals.latestTimestamp;
    this.fundingPeriodEnd = this.fundingPeriodStart + 3 * 30 * 24 * 60 * 60; // 3 months in seconds
  }
}