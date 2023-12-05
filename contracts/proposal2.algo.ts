
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

class proposal extends Contract {
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

    // ...

    return projectProposal;
}

  async addProjectContribution(proposalID: number, contribution: Contribution): Promise<void> {
    const existingContributions = await (await this.getProposalFundingData(proposalID)).contributions;
    existingContributions.push(contribution);
  }}