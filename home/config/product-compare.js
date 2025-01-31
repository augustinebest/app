module.exports = product => {
    const products = {
        pagerduty: {
            productName: 'PagerDuty',
            iconUrl: '/img/pagerduty.jpeg',
            price: '$29/mo',
            oneuptimePrice: '$22/mo',
            description:
                'Check out how we compare with PagerDuty. We do most of what PagerDuty does and a whole lot more.',
            descriptionLine2:
                "If you're a startup, we're a lot cheaper than PagerDuty which saves you a hundreds today, thousands as you grow.",
            faq: [
                {
                    question: 'How does OneUptime compare with PagerDuty?',
                    answer:
                        'PagerDuty is an incident management and on call tool whereas OneUptime is a complete SRE and DevOps platform. OneUptime offers mostly everything that PagerDuty offers, but a lot more like monitoring, status-page, security, performance-monitoring and more. Please check detailed comparision above for more info.',
                },
                {
                    question:
                        'Do I need to buy a monitoring solution to monitor my resources?',
                    answer:
                        'PagerDuty needs a seperate monitoring solution that you need to buy which then sends data to PagerDuty for on call and incident management. OneUptime has a built in monitoring solution as well. You use one product, your team has one dashboard, save time, simplify ops.',
                },
                {
                    question:
                        'I have already bought an external monitoring solution. Will OneUptime work with it?',
                    answer:
                        'Yes! We integrate with every single monitoring solution in the market - like Pingdom, UptimeRobot, DataDog, Site 24x7 and more.',
                },
            ],
            items: [
                {
                    type: 'category',
                    title: 'Incident Management and On Call Scheduling',
                },
                {
                    type: 'item',
                    title: 'Alerts by Email, SMS, Call and Push Notifications',
                    description:
                        'Have your team alerted by any of the channels including Slack and Microsoft Teams',
                    productColumn: 'tick',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'item',
                    title: 'On Call Rotations',
                    description:
                        'Rotate your on-call team daily, weekly or monthly. We also support custom rotations.',
                    productColumn: 'tick',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'item',
                    title: 'Vacation Policy',
                    description:
                        "Have vacation policy built into your company's on-call schedule.",
                    productColumn: 'tick',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'item',
                    title: 'Sick Policy',
                    description:
                        "Have sick policy built into your company's on-call schedule.",
                    productColumn: 'tick',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'item',
                    title: 'On-call for Geo-distributed teams',
                    description:
                        'Support on-call schedules for teams in multiple timezones who are geo-distributed.',
                    productColumn: 'tick',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'category',
                    title: 'Monitoring',
                },
                {
                    type: 'item',
                    title: 'Monitor anything',
                    description:
                        "Server, Containers, API's, Websites, IoT and more.",
                    productColumn: '',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'item',
                    title: 'Uptime Check',
                    description: 'How often we check uptime of your resources.',
                    productColumn: '',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'item',
                    title: 'Probe Locations',
                    description:
                        'We check your uptime from different locations around the world.',
                    productColumn: '',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'item',
                    title: 'Public Status Pages',
                    description: 'Public Status Page for your customers.',
                    productColumn: 'Every 1 second',
                    oneuptimeColumn: 'US, Canada, EU & Australia.',
                },
                {
                    type: 'category',
                    title: 'Status Page',
                },
                {
                    type: 'item',
                    title: 'Public Status Pages',
                    description: 'Public Status Page for your customers.',
                    productColumn: '',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'item',
                    title: 'Unlimited Subscribers',
                    description:
                        'You can have unlimited customer subscribers and have them alerted by Email, SMS, RSS or more.',
                    productColumn: '',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'item',
                    title: 'Scheduled Events',
                    description:
                        'You can show scheduled maintenance window on your status page.',
                    productColumn: '',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'item',
                    title: 'Private Status Page',
                    description: 'Private status pages for your internal team.',
                    productColumn: '',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'category',
                    title: 'Misc',
                },
                {
                    type: 'item',
                    title: 'Integrations',
                    description:
                        'Integrate OneUptime with more than 2000+ apps.',
                    productColumn: 'Integrates with 350+ apps',
                    oneuptimeColumn: 'Integrates with 2000+ apps',
                },
                {
                    type: 'item',
                    title: 'API Access',
                    description:
                        'Build custom integrations with unlimited API access.',
                    productColumn: 'tick',
                    oneuptimeColumn: 'tick',
                },
            ],
        },
        'statuspage.io': {
            productName: 'StatusPage.io',
            iconUrl: '/img/statuspagelogo.png',
            price: '$79/mo',
            oneuptimePrice: '$22/mo',
            description:
                'Check out how we compare with StatusPage.io. We do most of what StatusPage.io does and a whole lot more.',
            descriptionLine2:
                "If you're a startup, we're a lot cheaper than StatusPage.io which saves you a hundreds today, thousands as you grow.",
            faq: [
                {
                    question: 'How does OneUptime compare with StatusPage.io?',
                    answer:
                        'StatusPage.io is a status page tool whereas OneUptime is a complete SRE and DevOps platform. OneUptime offers mostly everything that StatusPage.io offers, but a lot more like monitoring, incident management, on-call scheduling, security, performance-monitoring and more. Please check detailed comparision above for more info.',
                },
                {
                    question:
                        'Do I need to buy a monitoring solution to monitor my resources?',
                    answer:
                        'StatusPage.io needs a seperate monitoring solution that you need to buy which then sends data to StatusPage.io. OneUptime has a built in monitoring solution as well. You use one product, your team has one dashboard, save time, simplify ops.',
                },
                {
                    question:
                        'I have already bought an external monitoring solution. Will OneUptime work with it?',
                    answer:
                        'Yes! We integrate with every single monitoring solution in the market - like Pingdom, UptimeRobot, DataDog, Site 24x7 and more.',
                },
            ],
            items: [
                {
                    type: 'category',
                    title: 'Incident Management and On Call Scheduling',
                },
                {
                    type: 'item',
                    title: 'Alerts by Email, SMS, Call and Push Notifications',
                    description:
                        'Have your team alerted by any of the channels including Slack and Microsoft Teams',
                    productColumn: '',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'item',
                    title: 'On Call Rotations',
                    description:
                        'Rotate your on-call team daily, weekly or monthly. We also support custom rotations.',
                    productColumn: '',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'item',
                    title: 'Vacation Policy',
                    description:
                        "Have vacation policy built into your company's on-call schedule.",
                    productColumn: '',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'item',
                    title: 'Sick Policy',
                    description:
                        "Have sick policy built into your company's on-call schedule.",
                    productColumn: '',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'item',
                    title: 'On-call for Geo-distributed teams',
                    description:
                        'Support on-call schedules for teams in multiple timezones who are geo-distributed.',
                    productColumn: '',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'category',
                    title: 'Monitoring',
                },
                {
                    type: 'item',
                    title: 'Monitor anything',
                    description:
                        "Server, Containers, API's, Websites, IoT and more.",
                    productColumn: '',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'item',
                    title: 'Uptime Check',
                    description: 'How often we check uptime of your resources.',
                    productColumn: '',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'item',
                    title: 'Probe Locations',
                    description:
                        'We check your uptime from different locations around the world.',
                    productColumn: '',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'item',
                    title: 'Public Status Pages',
                    description: 'Public Status Page for your customers.',
                    productColumn: '',
                    oneuptimeColumn: 'US, Canada, EU & Australia.',
                },
                {
                    type: 'category',
                    title: 'Status Page',
                },
                {
                    type: 'item',
                    title: 'Public Status Pages',
                    description: 'Public Status Page for your customers.',
                    productColumn: 'tick',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'item',
                    title: 'Subscribers',
                    description:
                        'You can have customer subscribers and have them alerted by Email, SMS, RSS or more.',
                    productColumn: '250 Subscribers',
                    oneuptimeColumn: 'Unlimited Subscribers',
                },
                {
                    type: 'item',
                    title: 'Scheduled Events',
                    description:
                        'You can show scheduled maintenance window on your status page.',
                    productColumn: 'tick',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'item',
                    title: 'Private Status Page',
                    description: 'Private status pages for your internal team.',
                    productColumn: 'tick',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'category',
                    title: 'Misc',
                },
                {
                    type: 'item',
                    title: 'Integrations',
                    description:
                        'Integrate OneUptime with more than 2000+ apps.',
                    productColumn: 'Integrates with 80+ apps',
                    oneuptimeColumn: 'Integrates with 2000+ apps',
                },
                {
                    type: 'item',
                    title: 'API Access',
                    description:
                        'Build custom integrations with unlimited API access.',
                    productColumn: 'tick',
                    oneuptimeColumn: 'tick',
                },
            ],
        },
        pingdom: {
            productName: 'Pingdom',
            iconUrl: '/img/pingdom.svg',
            price: '$43/mo',
            oneuptimePrice: '$22/mo',
            description:
                'Check out how we compare with Pingdom. We do most of what Pingdom does and a whole lot more.',
            descriptionLine2:
                "If you're a startup, we're a lot cheaper than Pingdom which saves you a hundreds today, thousands as you grow.",
            faq: [
                {
                    question: 'How does OneUptime compare with Pingdom?',
                    answer:
                        'Pingdom is an monitoring tool whereas OneUptime is a complete SRE and DevOps platform. OneUptime offers mostly everything that Pingdom offers, but a lot more like monitoring, status-page, security, performance-monitoring and more. Please check detailed comparision above for more info.',
                },
                {
                    question:
                        'Do I need to buy an incident managemnrt and on-call solution for alerts?',
                    answer:
                        'Pingdom is a monitoring solution and you need to buy an on-call solution and incident management solution which Pingdom sends data to. OneUptime has a built in monitoring, on-cal and incident management. You use one product, your team has one dashboard, save time, simplify ops.',
                },
                {
                    question:
                        'I have already bought an external on-call and incident management solution. Will OneUptime work with it?',
                    answer:
                        'Yes! We integrate with every single on-call and incident management solution in the market - like PagerDuty, OpsGenie and more.',
                },
            ],
            items: [
                {
                    type: 'category',
                    title: 'Incident Management and On Call Scheduling',
                },
                {
                    type: 'item',
                    title: 'Alerts by Email, SMS, Call and Push Notifications',
                    description:
                        'Have your team alerted by any of the channels including Slack and Microsoft Teams',
                    productColumn: '',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'item',
                    title: 'On Call Rotations',
                    description:
                        'Rotate your on-call team daily, weekly or monthly. We also support custom rotations.',
                    productColumn: '',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'item',
                    title: 'Vacation Policy',
                    description:
                        "Have vacation policy built into your company's on-call schedule.",
                    productColumn: '',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'item',
                    title: 'Sick Policy',
                    description:
                        "Have sick policy built into your company's on-call schedule.",
                    productColumn: '',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'item',
                    title: 'On-call for Geo-distributed teams',
                    description:
                        'Support on-call schedules for teams in multiple timezones who are geo-distributed.',
                    productColumn: '',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'category',
                    title: 'Monitoring',
                },
                {
                    type: 'item',
                    title: 'Monitor anything',
                    description:
                        "Server, Containers, API's, Websites, IoT and more.",
                    productColumn: 'Monitors only API and Websites.',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'item',
                    title: 'Uptime Check',
                    description: 'How often we check uptime of your resources.',
                    productColumn: 'tick',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'item',
                    title: 'Probe Locations',
                    description:
                        'We check your uptime from different locations around the world.',
                    productColumn: 'tick',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'category',
                    title: 'Status Page',
                },
                {
                    type: 'item',
                    title: 'Public Status Pages',
                    description: 'Public Status Page for your customers.',
                    productColumn: 'tick',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'item',
                    title: 'Unlimited Subscribers',
                    description:
                        'You can have unlimited customer subscribers and have them alerted by Email, SMS, RSS or more.',
                    productColumn: '',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'item',
                    title: 'Scheduled Events',
                    description:
                        'You can show scheduled maintenance window on your status page.',
                    productColumn: '',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'item',
                    title: 'Private Status Page',
                    description: 'Private status pages for your internal team.',
                    productColumn: '',
                    oneuptimeColumn: 'tick',
                },
                {
                    type: 'category',
                    title: 'Misc',
                },
                {
                    type: 'item',
                    title: 'Integrations',
                    description:
                        'Integrate OneUptime with more than 2000+ apps.',
                    productColumn: 'Integrates with 100+ apps',
                    oneuptimeColumn: 'Integrates with 2000+ apps',
                },
                {
                    type: 'item',
                    title: 'API Access',
                    description:
                        'Build custom integrations with unlimited API access.',
                    productColumn: 'tick',
                    oneuptimeColumn: 'tick',
                },
            ],
        },
    };

    return products[product];
};
