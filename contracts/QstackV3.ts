
import { Contract } from '@algorandfoundation/tealscript';

interface Contribution {
  contributor: Address; // Address of the contributor
  amount: number; // Amount contributed
}

interface ProjectProposal {
  id: Address; // Unique project proposal ID
  ownerAddress: Address; // Address of the project owner
  title: string; // Project title
  description: string; // Detailed project description
  fundingGoal: number; // Total funding goal for the project
  funding: number; // Amount of funding received for the project
  matchedFunds: number; // Amount of matched funds received through quadratic funding
  contributions: Contribution[]; // Array to store contributions for this proposal
}

class QstackV3 extends Contract {
  proposer = GlobalStateKey<Address>();
  contributor = GlobalStateKey<Address>();
  fundingPeriodStart = GlobalStateKey<number>();
  proposal = GlobalStateKey<string>();
  endTime = GlobalStateKey<number>();
  contributionAmount = GlobalStateKey<number>();
  funding = GlobalStateKey<number>();
  matchedFunds = GlobalStateKey<number>();

  constructor() {
    super();
  }

  createApplication(
    proposer: Address,
    contributor: Address,
    fundingPeriodStart: number,
    proposal: string,
    endTime: number,
    contributionAmount: number,
    funding: number,
    matchedFunds: number
  ) {
    this.proposer.value = proposer;
    this.contributor.value = contributor;
    this.fundingPeriodStart.value = fundingPeriodStart;
    this.proposal.value = proposal;
    this.endTime.value = endTime;
    this.contributionAmount.value = contributionAmount;
    this.funding.value = funding;
    this.matchedFunds.value = matchedFunds;
  }

  // Access and modify project proposals using the global array
  async submitProjectProposal(projectProposal: ProjectProposal) {
    const currentTime = globals.latestTimestamp;

    if (currentTime < this.fundingPeriodStart.value || currentTime > this.endTime.value) {
        throw new Error('Proposals can only be submitted during the active funding period');
    }

    // Calculate matched funds using the quadratic funding formula
    const totalContributions = projectProposal.contributions.reduce((sum, contribution) => sum + contribution.amount, 0);
    const matchedFunds = ((totalContributions + 1) ** (1 / 2) - 1) ** 2;

    // Update project proposal with matched funds
    projectProposal.matchedFunds = matchedFunds;

    // Add the contribution to the project's contributions
    projectProposal.contributions.push({
        contributor: msg.sender,
        amount: this.contributionAmount.value, // Access the value of this.contributionAmount
    });
  }

  // Access and modify project contributions using the global array
proposalProposals: [number, ProjectProposal][] = []; // Declare and initialize proposalProposals array

async getProposalFundingData(proposalID: number): Promise<ProjectProposal> {
    // Find the project proposal with the given ID
    const projectProposalEntry = this.proposalProposals.find((pair) => pair[0] === proposalID);

    if (!projectProposalEntry) {
        throw new Error(`Proposal with ID ${proposalID} not found`);
    }

    const projectProposal: ProjectProposal = projectProposalEntry[1];

 

    return projectProposal;
}

  async addProjectContribution(proposalID: number, contribution: Contribution): Promise<void> {
    const existingContributions = await (await this.getProposalFundingData(proposalID)).contributions;
    existingContributions.push(contribution);

  }
// Access and modify project contributions using the global array
async getProjectContributions(proposalID: number): Promise<Contribution[]> {
  // Find the project proposal with the given ID
  const projectProposalEntry = this.proposalProposals.find((pair) => pair[0] === proposalID);

  if (!projectProposalEntry) {
    throw new Error(`Proposal with ID ${proposalID} not found`);
  }

  const projectProposal: ProjectProposal = projectProposalEntry[1];

  // Return the project's contributions
  return projectProposal.contributions;
}

// Add funds to the matching pool
async fundMatchingPool(amount: number) {
    // Access the matching pool balance from global state
    let matchingPoolBalance = await this.getMatchingPoolBalance();

    // Add the contribution to the matching pool balance
    matchingPoolBalance += amount;

    // Update the matching pool balance in global state
    await this.setMatchingPoolBalance(matchingPoolBalance);
}

async setMatchingPoolBalance(balance: number) {
    // Set the matching pool balance in global state
    // Implementation goes here
}

// Get the current matching pool balance
async getMatchingPoolBalance(): Promise<number> {
    // Access the matching pool balance from global state
    const matchingPoolBalance = await this.getMatchingPoolBalance();

    return matchingPoolBalance;
}

// Get the start and end timestamps of the current funding period
async getFundingPeriodData(): Promise<{ start: number; end: number }> {
    const fundingPeriodStart = this.fundingPeriodStart.value;
    const endTime = this.endTime.value; // Access the value of this.endTime

    return {
        start: fundingPeriodStart,
        end: endTime,
    };
}
  }