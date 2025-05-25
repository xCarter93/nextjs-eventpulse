import React from "react";
import { Button, Card, CardBody, CardFooter, CardHeader, Checkbox } from "@heroui/react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";

export const Pricing = () => {
  const [isAnnual, setIsAnnual] = React.useState(true);
  
  const plans = [
    {
      name: "Starter",
      price: isAnnual ? 19 : 29,
      description: "Perfect for individuals and small events",
      features: [
        "Up to 500 contacts",
        "10 events per month",
        "Email reminders",
        "Basic email templates",
        "Standard support"
      ],
      cta: "Start Free Trial",
      popular: false
    },
    {
      name: "Professional",
      price: isAnnual ? 49 : 69,
      description: "Ideal for growing businesses and regular events",
      features: [
        "Up to 5,000 contacts",
        "Unlimited events",
        "Advanced email reminders",
        "Custom email templates",
        "Priority support",
        "Event analytics",
        "Integrations with 20+ apps"
      ],
      cta: "Start Free Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: isAnnual ? 99 : 129,
      description: "For large organizations with complex needs",
      features: [
        "Unlimited contacts",
        "Unlimited events",
        "Advanced automation",
        "White-label emails",
        "Dedicated account manager",
        "Advanced analytics",
        "API access",
        "SSO authentication"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <section id="pricing" className="py-20 md:py-28 bg-content2">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-foreground-600 mb-8">
            Choose the plan that fits your event management needs.
          </p>
          
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm ${!isAnnual ? 'text-foreground' : 'text-foreground-500'}`}>Monthly</span>
            <Checkbox
              isSelected={isAnnual}
              onValueChange={setIsAnnual}
              size="lg"
              color="primary"
            />
            <span className={`text-sm ${isAnnual ? 'text-foreground' : 'text-foreground-500'}`}>
              Annual <span className="text-xs text-primary ml-1">(Save 20%)</span>
            </span>
          </div>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {plans.map((plan, index) => (
            <motion.div key={index} variants={item} className="flex">
              <Card className={`h-full border ${plan.popular ? 'border-primary' : 'border-divider'} overflow-visible`}>
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <CardHeader className="flex flex-col gap-1 pb-0">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-foreground-500">{plan.description}</p>
                </CardHeader>
                <CardBody className="py-4">
                  <div className="mb-6">
                    <div className="flex items-end">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-foreground-500 ml-1">/mo</span>
                    </div>
                    {isAnnual && (
                      <p className="text-xs text-foreground-500">Billed annually (${plan.price * 12}/year)</p>
                    )}
                  </div>
                  
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="rounded-full bg-primary-100 p-1 mt-1">
                          <Icon icon="lucide:check" className="text-primary text-sm" />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
                <CardFooter>
                  <Button 
                    fullWidth 
                    color={plan.popular ? "primary" : "default"} 
                    variant={plan.popular ? "solid" : "flat"}
                  >
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};