import EasterCampaignImg from '@/public/images/contributing/easter-campaign.webp';
import ElderlyVisitImg from '@/public/images/contributing/elderly-visit.webp';
import ChildrenDayCampaignImg from '@/public/images/contributing/children-day-campaign.webp';
import DonationCampaignImg from '@/public/images/contributing/donate-campaign.webp';
// Smaller copies for the grid. The viewer shows the full photos.
import EasterCampaignThumb from '@/public/images/contributing/easter-campaign-thumb.webp';
import ElderlyVisitThumb from '@/public/images/contributing/elderly-visit-thumb.webp';
import ChildrenDayCampaignThumb from '@/public/images/contributing/children-day-campaign-thumb.webp';
import DonationCampaignThumb from '@/public/images/contributing/donate-campaign-thumb.webp';

export const items = [
  {
    number: '01',
    title: 'Easter donation campaigns',
    desc: 'Delivering gifts, food, and essential supplies to children from underserved communities.',
    src: EasterCampaignImg,
    thumb: EasterCampaignThumb,
    alt: 'Easter donation campaign',
    label: 'Easter campaign',
  },
  {
    number: '02',
    title: "Children's Day events",
    desc: 'Organizing recreational activities and donations creating meaningful experiences for children.',
    src: ChildrenDayCampaignImg,
    thumb: ChildrenDayCampaignThumb,
    alt: "Children's Day event",
    label: "Children's Day",
  },
  {
    number: '03',
    title: 'Elderly home visits',
    desc: 'Visits promoting interaction, wellbeing, and emotional support in elderly care homes.',
    src: ElderlyVisitImg,
    thumb: ElderlyVisitThumb,
    alt: 'Elderly care home visit',
    label: 'Elderly visits',
  },
  {
    number: '04',
    title: 'General donation drives',
    desc: 'Campaigns providing food, clothing, and essential items for families in vulnerable conditions.',
    src: DonationCampaignImg,
    thumb: DonationCampaignThumb,
    alt: 'Community donation campaign',
    label: 'Donation drives',
  },
];
